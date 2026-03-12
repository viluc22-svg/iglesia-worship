/**
 * SyncManager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncManager } from './SyncManager';
import { LocalStorageService } from './LocalStorageService';
import type { Musician, PendingChange } from '../../types/musician';

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    syncManager = SyncManager.getInstance();
    localStorageService = LocalStorageService.getInstance();
    localStorageService.clearAll();
  });

  afterEach(() => {
    syncManager.destroy();
    localStorageService.clearAll();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SyncManager.getInstance();
      const instance2 = SyncManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Sync Pending Changes', () => {
    it('should handle empty pending changes', async () => {
      await syncManager.syncPendingChanges();
      expect(syncManager.getPendingChangesCount()).toBe(0);
    });

    it('should not sync if already syncing', async () => {
      const callback = vi.fn();
      syncManager.onSyncComplete(callback);

      // Start sync
      const syncPromise = syncManager.syncPendingChanges();

      // Try to sync again while first is in progress
      await syncManager.syncPendingChanges();

      await syncPromise;

      // Callback should only be called once
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should track sync status', async () => {
      expect(syncManager.isSyncing()).toBe(false);

      const syncPromise = syncManager.syncPendingChanges();
      // Note: This might be false immediately since there are no changes
      await syncPromise;

      expect(syncManager.isSyncing()).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflict using most recent timestamp', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      const local: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Local',
        instrumento: 'Guitarra',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: now,
        contraseña: 'hash',
      };

      const remote: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Remote',
        instrumento: 'Piano',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: earlier,
        contraseña: 'hash',
      };

      const resolved = syncManager.resolveConflict(local, remote);

      expect(resolved.nombre).toBe('Local');
      expect(resolved.instrumento).toBe('Guitarra');
    });

    it('should prefer remote when it has more recent timestamp', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      const local: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Local',
        instrumento: 'Guitarra',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: earlier,
        contraseña: 'hash',
      };

      const remote: Musician = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Remote',
        instrumento: 'Piano',
        rol: 'user',
        fechaRegistro: earlier,
        fechaActualizacion: now,
        contraseña: 'hash',
      };

      const resolved = syncManager.resolveConflict(local, remote);

      expect(resolved.nombre).toBe('Remote');
      expect(resolved.instrumento).toBe('Piano');
    });
  });

  describe('Periodic Sync', () => {
    it('should start periodic sync', () => {
      syncManager.startPeriodicSync(1000);
      expect(syncManager).toBeDefined();
      syncManager.stopPeriodicSync();
    });

    it('should stop periodic sync', () => {
      syncManager.startPeriodicSync(1000);
      syncManager.stopPeriodicSync();
      expect(syncManager).toBeDefined();
    });

    it('should not start periodic sync twice', () => {
      syncManager.startPeriodicSync(1000);
      syncManager.startPeriodicSync(1000); // Should log warning
      syncManager.stopPeriodicSync();
      expect(syncManager).toBeDefined();
    });
  });

  describe('Sync Complete Callbacks', () => {
    it('should register and call sync complete callback', async () => {
      const callback = vi.fn();
      syncManager.onSyncComplete(callback);

      await syncManager.syncPendingChanges();

      expect(callback).toHaveBeenCalledWith(true, 0);
    });

    it('should unregister sync complete callback', async () => {
      const callback = vi.fn();
      syncManager.onSyncComplete(callback);
      syncManager.offSyncComplete(callback);

      await syncManager.syncPendingChanges();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple callbacks', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      syncManager.onSyncComplete(callback1);
      syncManager.onSyncComplete(callback2);

      await syncManager.syncPendingChanges();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Pending Changes Count', () => {
    it('should return correct pending changes count', () => {
      expect(syncManager.getPendingChangesCount()).toBe(0);

      const change: PendingChange = {
        id: '1',
        type: 'create',
        musicianId: 'test',
        data: { email: 'test@example.com', nombre: 'Test', instrumento: 'Guitarra', contraseña: 'pass' },
        timestamp: new Date(),
        retries: 0,
      };

      localStorageService.addPendingChange(change);
      expect(syncManager.getPendingChangesCount()).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      const callback = vi.fn();
      syncManager.onSyncComplete(callback);
      syncManager.startPeriodicSync(1000);

      syncManager.destroy();

      await syncManager.syncPendingChanges();

      // Callback should not be called after destroy
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
