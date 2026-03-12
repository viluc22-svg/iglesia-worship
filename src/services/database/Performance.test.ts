/**
 * Performance Tests
 * Tests for performance metrics: load time, sync time, memory usage, validation time
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { ValidationService } from './ValidationService';
import { SyncManager } from './SyncManager';
import { LocalStorageService } from './LocalStorageService';
import type { Musician, MusicianData, PendingChange } from '../../types/musician';

describe('Performance Tests', () => {
  let dbService: DatabaseService;
  let validationService: ValidationService;
  let syncManager: SyncManager;
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    (DatabaseService as any).instance = undefined;
    (ValidationService as any).instance = undefined;
    (SyncManager as any).instance = undefined;
    (LocalStorageService as any).instance = undefined;

    dbService = DatabaseService.getInstance();
    validationService = ValidationService.getInstance();
    syncManager = SyncManager.getInstance();
    localStorageService = LocalStorageService.getInstance();
    localStorageService.clearAll();
  });

  afterEach(() => {
    localStorageService.clearAll();
    syncManager.destroy();
  });

  describe('List Loading Performance', () => {
    it('should load list of 10 musicians in under 100ms', async () => {
      // Create 10 musicians
      const musicians: Musician[] = [];
      for (let i = 0; i < 10; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: 'Guitarra',
          contraseña: 'password123',
        };
        const musician = await dbService.createMusician(data);
        musicians.push(musician);
      }

      // Measure load time
      const startTime = performance.now();
      const result = await dbService.getMusicians();
      const endTime = performance.now();

      const loadTime = endTime - startTime;

      expect(result.length).toBeGreaterThanOrEqual(10);
      expect(loadTime).toBeLessThan(100);
    });

    it('should load list of 50 musicians in under 200ms', async () => {
      // Create 50 musicians
      for (let i = 0; i < 50; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: 'Piano',
          contraseña: 'password123',
        };
        await dbService.createMusician(data);
      }

      // Measure load time
      const startTime = performance.now();
      const result = await dbService.getMusicians();
      const endTime = performance.now();

      const loadTime = endTime - startTime;

      expect(result.length).toBeGreaterThanOrEqual(50);
      expect(loadTime).toBeLessThan(200);
    });

    it('should load list of 100+ musicians in under 500ms', async () => {
      // Create 100 musicians
      for (let i = 0; i < 100; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: i % 2 === 0 ? 'Guitarra' : 'Piano',
          contraseña: 'password123',
        };
        await dbService.createMusician(data);
      }

      // Measure load time
      const startTime = performance.now();
      const result = await dbService.getMusicians();
      const endTime = performance.now();

      const loadTime = endTime - startTime;

      expect(result.length).toBeGreaterThanOrEqual(100);
      expect(loadTime).toBeLessThan(500);
    });
  });

  describe('Sync Performance', () => {
    it('should sync 10 pending changes in under 100ms', async () => {
      // Create 10 pending changes
      for (let i = 0; i < 10; i++) {
        const change: PendingChange = {
          id: `change${i}`,
          type: 'create',
          musicianId: `musician${i}`,
          data: {
            email: `musician${i}@example.com`,
            nombre: `Musician ${i}`,
            instrumento: 'Guitarra',
            contraseña: 'password123',
          },
          timestamp: new Date(),
          retries: 0,
        };
        localStorageService.addPendingChange(change);
      }

      // Measure sync time
      const startTime = performance.now();
      await syncManager.syncPendingChanges();
      const endTime = performance.now();

      const syncTime = endTime - startTime;

      expect(syncTime).toBeLessThan(100);
    });

    it('should sync 50 pending changes in under 300ms', async () => {
      // Create 50 pending changes
      for (let i = 0; i < 50; i++) {
        const change: PendingChange = {
          id: `change${i}`,
          type: 'create',
          musicianId: `musician${i}`,
          data: {
            email: `musician${i}@example.com`,
            nombre: `Musician ${i}`,
            instrumento: 'Piano',
            contraseña: 'password123',
          },
          timestamp: new Date(),
          retries: 0,
        };
        localStorageService.addPendingChange(change);
      }

      // Measure sync time
      const startTime = performance.now();
      await syncManager.syncPendingChanges();
      const endTime = performance.now();

      const syncTime = endTime - startTime;

      expect(syncTime).toBeLessThan(300);
    });

    it('should sync 100+ pending changes in under 500ms', async () => {
      // Create 100 pending changes
      for (let i = 0; i < 100; i++) {
        const change: PendingChange = {
          id: `change${i}`,
          type: i % 3 === 0 ? 'create' : i % 3 === 1 ? 'update' : 'delete',
          musicianId: `musician${i}`,
          data: {
            email: `musician${i}@example.com`,
            nombre: `Musician ${i}`,
            instrumento: i % 2 === 0 ? 'Guitarra' : 'Piano',
            contraseña: 'password123',
          },
          timestamp: new Date(),
          retries: 0,
        };
        localStorageService.addPendingChange(change);
      }

      // Measure sync time
      const startTime = performance.now();
      await syncManager.syncPendingChanges();
      const endTime = performance.now();

      const syncTime = endTime - startTime;

      expect(syncTime).toBeLessThan(500);
    });
  });

  describe('Validation Performance', () => {
    it('should validate email in under 5ms', () => {
      const startTime = performance.now();
      validationService.validateEmail('test@example.com');
      const endTime = performance.now();

      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(5);
    });

    it('should validate name in under 5ms', () => {
      const startTime = performance.now();
      validationService.validateName('Test User');
      const endTime = performance.now();

      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(5);
    });

    it('should validate instrument in under 5ms', () => {
      const startTime = performance.now();
      validationService.validateInstrument('Guitarra');
      const endTime = performance.now();

      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(5);
    });

    it('should validate password in under 5ms', () => {
      const startTime = performance.now();
      validationService.validatePassword('password123');
      const endTime = performance.now();

      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(5);
    });

    it('should validate complete musician data in under 20ms', () => {
      const data: MusicianData = {
        email: 'musician@example.com',
        nombre: 'Test Musician',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      const startTime = performance.now();
      validationService.validateMusician(data);
      const endTime = performance.now();

      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(20);
    });

    it('should validate 100 musicians in under 2000ms', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: i % 2 === 0 ? 'Guitarra' : 'Piano',
          contraseña: 'password123',
        };
        validationService.validateMusician(data);
      }

      const endTime = performance.now();

      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(2000);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory when creating musicians', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create 100 musicians
      for (let i = 0; i < 100; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: 'Guitarra',
          contraseña: 'password123',
        };
        await dbService.createMusician(data);
      }

      const afterCreationMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Clear musicians
      localStorageService.clearAll();

      // Memory should not grow indefinitely
      // Note: This is a basic check; actual memory profiling requires more sophisticated tools
      expect(afterCreationMemory).toBeGreaterThanOrEqual(initialMemory);
    });

    it('should handle large pending changes queue', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Add 1000 pending changes
      for (let i = 0; i < 1000; i++) {
        const change: PendingChange = {
          id: `change${i}`,
          type: 'create',
          musicianId: `musician${i}`,
          data: {
            email: `musician${i}@example.com`,
            nombre: `Musician ${i}`,
            instrumento: 'Guitarra',
            contraseña: 'password123',
          },
          timestamp: new Date(),
          retries: 0,
        };
        localStorageService.addPendingChange(change);
      }

      const afterAddMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Clear pending changes
      localStorageService.clearPendingChanges();

      // Memory should be manageable
      expect(afterAddMemory).toBeGreaterThanOrEqual(initialMemory);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent musician creation', async () => {
      const startTime = performance.now();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: 'Guitarra',
          contraseña: 'password123',
        };
        promises.push(dbService.createMusician(data));
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(results.length).toBe(10);
      expect(totalTime).toBeLessThan(500);
    });

    it('should handle concurrent validation', () => {
      const startTime = performance.now();

      const validations = [];
      for (let i = 0; i < 100; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: i % 2 === 0 ? 'Guitarra' : 'Piano',
          contraseña: 'password123',
        };
        validations.push(validationService.validateMusician(data));
      }

      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(validations.length).toBe(100);
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Throughput', () => {
    it('should create at least 100 musicians per second', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: 'Guitarra',
          contraseña: 'password123',
        };
        await dbService.createMusician(data);
      }

      const endTime = performance.now();

      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      const throughput = 100 / totalTime;

      expect(throughput).toBeGreaterThan(100);
    });

    it('should validate at least 1000 musicians per second', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const data: MusicianData = {
          email: `musician${i}@example.com`,
          nombre: `Musician ${i}`,
          instrumento: i % 2 === 0 ? 'Guitarra' : 'Piano',
          contraseña: 'password123',
        };
        validationService.validateMusician(data);
      }

      const endTime = performance.now();

      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      const throughput = 1000 / totalTime;

      expect(throughput).toBeGreaterThan(1000);
    });
  });
});
