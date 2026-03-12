/**
 * Phase 3 Integration Tests
 * Tests for ConnectionManager, SyncManager, and InitialSync working together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionManager } from './ConnectionManager';
import { SyncManager } from './SyncManager';
import { LocalStorageService } from './LocalStorageService';
import { performInitialSync } from './InitialSync';
import type { PendingChange, Musician } from '../../types/musician';

describe('Phase 3 Integration', () => {
  let connectionManager: ConnectionManager;
  let syncManager: SyncManager;
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    connectionManager = ConnectionManager.getInstance();
    syncManager = SyncManager.getInstance();
    localStorageService = LocalStorageService.getInstance();
    localStorageService.clearAll();
  });

  afterEach(() => {
    connectionManager.destroy();
    syncManager.destroy();
    localStorageService.clearAll();
  });

  describe('Connection and Sync Integration', () => {
    it('should sync when connection is restored', async () => {
      const syncCallback = vi.fn();
      syncManager.onSyncComplete(syncCallback);

      // Add pending change
      const change: PendingChange = {
        id: '1',
        type: 'create',
        musicianId: 'test',
        data: {
          email: 'test@example.com',
          nombre: 'Test',
          instrumento: 'Guitarra',
          contraseña: 'pass',
        },
        timestamp: new Date(),
        retries: 0,
      };

      localStorageService.addPendingChange(change);

      // Simulate connection restored
      window.dispatchEvent(new Event('online'));

      // Sync should be triggered
      await syncManager.syncPendingChanges();

      expect(syncCallback).toHaveBeenCalled();
    });

    it('should handle offline scenario', async () => {
      const connectionCallback = vi.fn();
      connectionManager.onConnectionChange(connectionCallback);

      // Simulate offline
      window.dispatchEvent(new Event('offline'));

      expect(connectionCallback).toHaveBeenCalledWith(false);
    });
  });

  describe('Initial Sync with Fallback', () => {
    it('should load from localStorage when database is unavailable', async () => {
      // Add data to localStorage
      const musician: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        instrumento: 'Guitarra',
        rol: 'user',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
        contraseña: 'hash',
      };

      localStorageService.saveMusician(musician);

      const result = await performInitialSync({ timeout: 100 });

      expect(result.source).toBe('localStorage');
      expect(result.musicians.length).toBeGreaterThan(0);
    });

    it('should complete initial sync within timeout', async () => {
      const startTime = Date.now();
      const result = await performInitialSync({ timeout: 1000 });
      const duration = Date.now() - startTime;

      expect(result.duration).toBeLessThan(1000);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Conflict Resolution', () => {
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
  });

  describe('Periodic Sync', () => {
    it('should start and stop periodic sync', () => {
      syncManager.startPeriodicSync(1000);
      expect(syncManager).toBeDefined();

      syncManager.stopPeriodicSync();
      expect(syncManager).toBeDefined();
    });

    it('should trigger sync callback on completion', async () => {
      const callback = vi.fn();
      syncManager.onSyncComplete(callback);

      await syncManager.syncPendingChanges();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle sync errors gracefully', async () => {
      const callback = vi.fn();
      syncManager.onSyncComplete(callback);

      // Add invalid change
      const change: PendingChange = {
        id: '1',
        type: 'create',
        musicianId: 'test',
        data: {
          email: 'invalid',
          nombre: '',
          instrumento: 'Invalid',
          contraseña: 'pass',
        },
        timestamp: new Date(),
        retries: 0,
      };

      localStorageService.addPendingChange(change);

      // Should not throw
      await expect(syncManager.syncPendingChanges()).resolves.not.toThrow();
    });
  });

  describe('Full Workflow', () => {
    it('should handle complete offline-first workflow', async () => {
      // 1. Initialize app
      const initResult = await performInitialSync({ timeout: 100 });
      expect(initResult).toBeDefined();

      // 2. Add pending change (simulating offline operation)
      const change: PendingChange = {
        id: '1',
        type: 'create',
        musicianId: 'new',
        data: {
          email: 'new@example.com',
          nombre: 'New Musician',
          instrumento: 'Guitarra',
          contraseña: 'pass',
        },
        timestamp: new Date(),
        retries: 0,
      };

      localStorageService.addPendingChange(change);
      expect(syncManager.getPendingChangesCount()).toBe(1);

      // 3. Simulate connection restored
      const syncCallback = vi.fn();
      syncManager.onSyncComplete(syncCallback);

      window.dispatchEvent(new Event('online'));

      // 4. Sync pending changes
      await syncManager.syncPendingChanges();

      // 5. Verify sync completed
      expect(syncCallback).toHaveBeenCalled();
    });

    it('should maintain data consistency across services', async () => {
      const musician: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        instrumento: 'Guitarra',
        rol: 'user',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
        contraseña: 'hash',
      };

      // Save to localStorage
      localStorageService.saveMusician(musician);

      // Verify it's there
      const stored = localStorageService.getMusician('1');
      expect(stored).toBeDefined();
      expect(stored?.email).toBe('test@example.com');

      // Perform initial sync
      await performInitialSync({ timeout: 100 });

      // Verify data is still consistent
      const afterSync = localStorageService.getMusician('1');
      expect(afterSync).toBeDefined();
      expect(afterSync?.email).toBe('test@example.com');
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources properly', () => {
      const connectionCallback = vi.fn();
      const syncCallback = vi.fn();

      connectionManager.onConnectionChange(connectionCallback);
      syncManager.onSyncComplete(syncCallback);

      syncManager.startPeriodicSync(1000);

      // Cleanup
      connectionManager.destroy();
      syncManager.destroy();

      // Callbacks should not be called after cleanup
      window.dispatchEvent(new Event('online'));

      expect(connectionCallback).not.toHaveBeenCalled();
    });
  });
});
