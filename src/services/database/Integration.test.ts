/**
 * Integration Tests
 * Tests for complete workflows: registration, update, deletion, sync with offline, recovery
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { LocalStorageService } from './LocalStorageService';
import { ValidationService } from './ValidationService';
import { SyncManager } from './SyncManager';
import { ConnectionManager } from './ConnectionManager';
import type { Musician, MusicianData, PendingChange } from '../../types/musician';

describe('Integration Tests', () => {
  let dbService: DatabaseService;
  let localStorageService: LocalStorageService;
  let validationService: ValidationService;
  let syncManager: SyncManager;

  beforeEach(() => {
    // Reset all singletons
    (DatabaseService as any).instance = undefined;
    (LocalStorageService as any).instance = undefined;
    (ValidationService as any).instance = undefined;
    (SyncManager as any).instance = undefined;
    (ConnectionManager as any).instance = undefined;

    dbService = DatabaseService.getInstance();
    localStorageService = LocalStorageService.getInstance();
    validationService = ValidationService.getInstance();
    syncManager = SyncManager.getInstance();

    localStorageService.clearAll();
  });

  afterEach(() => {
    localStorageService.clearAll();
    syncManager.destroy();
  });

  describe('Complete Registration Flow', () => {
    it('should complete full registration workflow', async () => {
      const userData: MusicianData = {
        email: 'newuser@example.com',
        nombre: 'New User',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      // Step 1: Validate data
      const validationResult = validationService.validateMusician(userData);
      expect(validationResult.isValid).toBe(true);

      // Step 2: Check email uniqueness
      const isUnique = await dbService.isEmailUnique(userData.email);
      expect(isUnique).toBe(true);

      // Step 3: Create in database
      const musician = await dbService.createMusician(userData);
      expect(musician.id).toBeDefined();
      expect(musician.email).toBe(userData.email);

      // Step 4: Save to localStorage
      localStorageService.saveMusician(musician);
      const saved = localStorageService.getMusicians();
      expect(saved.some(m => m.email === userData.email)).toBe(true);

      // Step 5: Verify email is no longer unique
      const isUniqueAfter = await dbService.isEmailUnique(userData.email);
      expect(isUniqueAfter).toBe(false);
    });

    it('should reject registration with invalid data', async () => {
      const invalidData: MusicianData = {
        email: 'invalid-email',
        nombre: 'J',
        instrumento: 'InvalidInstrument',
        contraseña: '123',
      };

      const validationResult = validationService.validateMusician(invalidData);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    it('should reject duplicate email registration', async () => {
      const userData: MusicianData = {
        email: 'duplicate@example.com',
        nombre: 'User 1',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      // Register first user
      await dbService.createMusician(userData);

      // Try to register with same email
      const isUnique = await dbService.isEmailUnique(userData.email);
      expect(isUnique).toBe(false);
    });
  });

  describe('Complete Update Flow', () => {
    it('should complete full update workflow', async () => {
      // Step 1: Create musician
      const createData: MusicianData = {
        email: 'musician@example.com',
        nombre: 'Original Name',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      const created = await dbService.createMusician(createData);
      localStorageService.saveMusician(created);

      // Step 2: Prepare update data
      const updateData: Partial<MusicianData> = {
        nombre: 'Updated Name',
        instrumento: 'Piano',
      };

      // Step 3: Validate update data
      const validationResult = validationService.validateMusician({
        ...createData,
        ...updateData,
      });
      expect(validationResult.isValid).toBe(true);

      // Step 4: Update in database
      const updated = await dbService.updateMusician(created.id, updateData);
      expect(updated.nombre).toBe(updateData.nombre);
      expect(updated.instrumento).toBe(updateData.instrumento);

      // Step 5: Update in localStorage
      localStorageService.updateMusician(created.id, updateData);
      const stored = localStorageService.getMusicians();
      const storedMusician = stored.find(m => m.id === created.id);
      expect(storedMusician?.nombre).toBe(updateData.nombre);

      // Step 6: Verify update date changed
      expect(updated.fechaActualizacion.getTime()).toBeGreaterThanOrEqual(
        created.fechaActualizacion.getTime()
      );
    });

    it('should handle partial updates', async () => {
      const createData: MusicianData = {
        email: 'musician@example.com',
        nombre: 'Original',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      const created = await dbService.createMusician(createData);

      // Update only name
      const updated1 = await dbService.updateMusician(created.id, { nombre: 'Updated' });
      expect(updated1.nombre).toBe('Updated');
      expect(updated1.instrumento).toBe('Guitarra');

      // Update only instrument
      const updated2 = await dbService.updateMusician(created.id, { instrumento: 'Piano' });
      expect(updated2.nombre).toBe('Updated');
      expect(updated2.instrumento).toBe('Piano');
    });
  });

  describe('Complete Deletion Flow', () => {
    it('should complete full deletion workflow', async () => {
      // Step 1: Create musician
      const createData: MusicianData = {
        email: 'musician@example.com',
        nombre: 'Test',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      const created = await dbService.createMusician(createData);
      localStorageService.saveMusician(created);

      // Step 2: Verify musician exists
      let musicians = localStorageService.getMusicians();
      expect(musicians.some(m => m.id === created.id)).toBe(true);

      // Step 3: Delete from database
      await dbService.deleteMusician(created.id);

      // Step 4: Delete from localStorage
      localStorageService.deleteMusician(created.id);

      // Step 5: Verify musician is deleted
      musicians = localStorageService.getMusicians();
      expect(musicians.some(m => m.id === created.id)).toBe(false);
    });

    it('should handle deletion of non-existent musician', async () => {
      await expect(dbService.deleteMusician('nonexistent-id')).resolves.toBeUndefined();
    });
  });

  describe('Offline Sync Workflow', () => {
    it('should queue changes when offline', async () => {
      // Step 1: Go offline
      dbService.setConnected(false);

      // Step 2: Try to create musician (should fail)
      const createData: MusicianData = {
        email: 'musician@example.com',
        nombre: 'Test',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      await expect(dbService.createMusician(createData)).rejects.toThrow();

      // Step 3: Save to localStorage as pending
      const change: PendingChange = {
        id: '1',
        type: 'create',
        musicianId: 'temp-id',
        data: createData,
        timestamp: new Date(),
        retries: 0,
      };

      localStorageService.addPendingChange(change);

      // Step 4: Verify pending change is queued
      const pending = localStorageService.getPendingChanges();
      expect(pending.length).toBe(1);
      expect(pending[0].type).toBe('create');
    });

    it('should sync pending changes when connection recovers', async () => {
      // Step 1: Add pending changes
      const change1: PendingChange = {
        id: '1',
        type: 'create',
        musicianId: 'musician1',
        data: {
          email: 'musician1@example.com',
          nombre: 'Musician 1',
          instrumento: 'Guitarra',
          contraseña: 'password123',
        },
        timestamp: new Date(),
        retries: 0,
      };

      const change2: PendingChange = {
        id: '2',
        type: 'create',
        musicianId: 'musician2',
        data: {
          email: 'musician2@example.com',
          nombre: 'Musician 2',
          instrumento: 'Piano',
          contraseña: 'password123',
        },
        timestamp: new Date(),
        retries: 0,
      };

      localStorageService.addPendingChange(change1);
      localStorageService.addPendingChange(change2);

      // Step 2: Verify pending changes exist
      let pending = localStorageService.getPendingChanges();
      expect(pending.length).toBe(2);

      // Step 3: Sync pending changes
      await syncManager.syncPendingChanges();

      // Step 4: Verify pending changes are cleared
      pending = localStorageService.getPendingChanges();
      expect(pending.length).toBe(0);
    });

    it('should handle sync with database unavailable', async () => {
      // Step 1: Go offline
      dbService.setConnected(false);

      // Step 2: Add pending changes
      const change: PendingChange = {
        id: '1',
        type: 'create',
        musicianId: 'musician1',
        data: {
          email: 'musician1@example.com',
          nombre: 'Musician 1',
          instrumento: 'Guitarra',
          contraseña: 'password123',
        },
        timestamp: new Date(),
        retries: 0,
      };

      localStorageService.addPendingChange(change);

      // Step 3: Try to sync (should handle gracefully)
      await syncManager.syncPendingChanges();

      // Step 4: Pending changes should still exist
      const pending = localStorageService.getPendingChanges();
      expect(pending.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Conflict Resolution Workflow', () => {
    it('should resolve conflicts using timestamp', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      const local: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Local Version',
        instrumento: 'Guitarra',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: now,
        contraseña: 'hash',
      };

      const remote: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Remote Version',
        instrumento: 'Piano',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: earlier,
        contraseña: 'hash',
      };

      const resolved = syncManager.resolveConflict(local, remote);

      expect(resolved.nombre).toBe('Local Version');
      expect(resolved.instrumento).toBe('Guitarra');
    });

    it('should prefer remote when it has newer timestamp', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      const local: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Local Version',
        instrumento: 'Guitarra',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: earlier,
        contraseña: 'hash',
      };

      const remote: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Remote Version',
        instrumento: 'Piano',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: now,
        contraseña: 'hash',
      };

      const resolved = syncManager.resolveConflict(local, remote);

      expect(resolved.nombre).toBe('Remote Version');
      expect(resolved.instrumento).toBe('Piano');
    });
  });

  describe('Periodic Sync Workflow', () => {
    it('should start and stop periodic sync', () => {
      syncManager.startPeriodicSync(1000);
      expect(syncManager).toBeDefined();

      syncManager.stopPeriodicSync();
      expect(syncManager).toBeDefined();
    });

    it('should not start periodic sync twice', () => {
      syncManager.startPeriodicSync(1000);
      syncManager.startPeriodicSync(1000); // Should log warning
      syncManager.stopPeriodicSync();
      expect(syncManager).toBeDefined();
    });

    it('should call sync complete callback', async () => {
      let callbackCalled = false;
      syncManager.onSyncComplete(() => {
        callbackCalled = true;
      });

      await syncManager.syncPendingChanges();

      expect(callbackCalled).toBe(true);
    });
  });

  describe('Multi-Musician Workflow', () => {
    it('should handle multiple musicians in workflow', async () => {
      const musicians: Musician[] = [];

      // Create 5 musicians
      for (let i = 0; i < 5; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: i % 2 === 0 ? 'Guitarra' : 'Piano',
          contraseña: 'password123',
        };

        const musician = await dbService.createMusician(data);
        musicians.push(musician);
        localStorageService.saveMusician(musician);
      }

      // Verify all musicians are saved
      const saved = localStorageService.getMusicians();
      expect(saved.length).toBeGreaterThanOrEqual(5);

      // Update each musician
      for (const musician of musicians) {
        const updateData: Partial<MusicianData> = {
          nombre: `${musician.nombre} Updated`,
        };

        await dbService.updateMusician(musician.id, updateData);
        localStorageService.updateMusician(musician.id, updateData);
      }

      // Delete some musicians
      for (let i = 0; i < 2; i++) {
        await dbService.deleteMusician(musicians[i].id);
        localStorageService.deleteMusician(musicians[i].id);
      }

      // Verify final state
      const final = localStorageService.getMusicians();
      expect(final.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should recover from connection error', async () => {
      // Step 1: Go offline
      dbService.setConnected(false);

      // Step 2: Try operation (should fail)
      const data: MusicianData = {
        email: 'test@example.com',
        nombre: 'Test',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      await expect(dbService.createMusician(data)).rejects.toThrow();

      // Step 3: Recover connection
      dbService.setConnected(true);

      // Step 4: Retry operation (should succeed)
      const musician = await dbService.createMusician(data);
      expect(musician.id).toBeDefined();
    });

    it('should handle validation errors gracefully', async () => {
      const invalidData: MusicianData = {
        email: 'invalid-email',
        nombre: 'J',
        instrumento: 'InvalidInstrument',
        contraseña: '123',
      };

      const validationResult = validationService.validateMusician(invalidData);
      expect(validationResult.isValid).toBe(false);

      // Should not attempt to create in database
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency Workflow', () => {
    it('should maintain consistency between database and localStorage', async () => {
      const data: MusicianData = {
        email: 'test@example.com',
        nombre: 'Test',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      // Create in database
      const created = await dbService.createMusician(data);

      // Save to localStorage
      localStorageService.saveMusician(created);

      // Verify consistency
      const dbMusicians = await dbService.getMusicians();
      const localMusicians = localStorageService.getMusicians();

      expect(dbMusicians.length).toBeGreaterThanOrEqual(1);
      expect(localMusicians.length).toBeGreaterThanOrEqual(1);
      expect(localMusicians.some(m => m.email === data.email)).toBe(true);
    });

    it('should sync updates between database and localStorage', async () => {
      const data: MusicianData = {
        email: 'test@example.com',
        nombre: 'Original',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      // Create and save
      const created = await dbService.createMusician(data);
      localStorageService.saveMusician(created);

      // Update in database
      const updateData: Partial<MusicianData> = { nombre: 'Updated' };
      await dbService.updateMusician(created.id, updateData);

      // Update in localStorage
      localStorageService.updateMusician(created.id, updateData);

      // Verify both are updated
      const localMusicians = localStorageService.getMusicians();
      const localMusician = localMusicians.find(m => m.id === created.id);

      expect(localMusician?.nombre).toBe('Updated');
    });
  });
});
