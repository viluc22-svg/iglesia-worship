/**
 * SyncManager
 * Manages synchronization between database and localStorage
 * Handles conflict resolution and periodic sync
 */

import type { Musician, MusicianData, PendingChange } from '../../types/musician';
import { Logger } from '../../utils/logger';
import { SyncError } from '../../types/errors';
import { DatabaseService } from './DatabaseService';
import { LocalStorageService } from './LocalStorageService';
import { ErrorHandler } from './ErrorHandler';

export type SyncCompleteCallback = (success: boolean, changesCount: number) => void;

export class SyncManager {
  private static instance: SyncManager;
  private databaseService: DatabaseService;
  private localStorageService: LocalStorageService;
  private errorHandler: ErrorHandler;
  private periodicSyncInterval: ReturnType<typeof setInterval> | null = null;
  private syncingFlag = false;
  private syncCompleteCallbacks: SyncCompleteCallback[] = [];

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.localStorageService = LocalStorageService.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Sync all pending changes to database
   */
  async syncPendingChanges(): Promise<void> {
    if (this.syncingFlag) {
      Logger.debug('SyncManager', 'Sync already in progress, skipping');
      return;
    }

    this.syncingFlag = true;
    let successCount = 0;
    let failureCount = 0;

    try {
      const pendingChanges = this.localStorageService.getPendingChanges();
      
      if (pendingChanges.length === 0) {
        Logger.debug('SyncManager', 'No pending changes to sync');
        this.notifySyncComplete(true, 0);
        return;
      }

      Logger.info('SyncManager', 'Starting sync of pending changes', { count: pendingChanges.length });

      // Process each pending change
      for (const change of pendingChanges) {
        try {
          await this.processPendingChange(change);
          successCount++;
          this.localStorageService.removePendingChange(change.id);
          Logger.debug('SyncManager', 'Pending change synced', { changeId: change.id, type: change.type });
        } catch (error) {
          failureCount++;
          
          // Increment retry count
          const updatedChange = { ...change, retries: change.retries + 1 };
          this.localStorageService.removePendingChange(change.id);
          
          // Only re-add if retries haven't exceeded limit
          if (updatedChange.retries < 5) {
            this.localStorageService.addPendingChange(updatedChange);
            Logger.warn('SyncManager', 'Pending change sync failed, will retry', {
              changeId: change.id,
              retries: updatedChange.retries,
              error,
            });
          } else {
            Logger.error('SyncManager', 'Pending change exceeded max retries', {
              changeId: change.id,
              error,
            });
            this.errorHandler.handleSyncError(
              new SyncError(`Change ${change.id} failed after 5 retries`, { change }),
              'SyncManager'
            );
          }
        }
      }

      Logger.info('SyncManager', 'Sync completed', { successCount, failureCount });
      this.notifySyncComplete(failureCount === 0, successCount);
    } catch (error) {
      Logger.error('SyncManager', 'Error during sync', error);
      this.errorHandler.handleSyncError(error as Error, 'SyncManager');
      this.notifySyncComplete(false, 0);
    } finally {
      this.syncingFlag = false;
    }
  }

  /**
   * Process a single pending change
   */
  private async processPendingChange(change: PendingChange): Promise<void> {
    switch (change.type) {
      case 'create':
        await this.databaseService.createMusician(change.data as MusicianData);
        break;
      case 'update':
        await this.databaseService.updateMusician(change.musicianId, change.data);
        break;
      case 'delete':
        await this.databaseService.deleteMusician(change.musicianId);
        break;
      default:
        throw new Error(`Unknown change type: ${change.type}`);
    }
  }

  /**
   * Resolve conflict between local and remote versions
   * Strategy: Use most recent timestamp
   */
  resolveConflict(local: Musician, remote: Musician): Musician {
    Logger.info('SyncManager', 'Resolving conflict', {
      localId: local.id,
      localTimestamp: local.fechaActualizacion,
      remoteTimestamp: remote.fechaActualizacion,
    });

    const localTime = new Date(local.fechaActualizacion).getTime();
    const remoteTime = new Date(remote.fechaActualizacion).getTime();

    const resolved = localTime >= remoteTime ? local : remote;
    Logger.debug('SyncManager', 'Conflict resolved', {
      winner: localTime >= remoteTime ? 'local' : 'remote',
      timestamp: resolved.fechaActualizacion,
    });

    return resolved;
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(interval: number = 30000): void {
    if (this.periodicSyncInterval) {
      Logger.warn('SyncManager', 'Periodic sync already running');
      return;
    }

    Logger.info('SyncManager', 'Starting periodic sync', { intervalMs: interval });

    this.periodicSyncInterval = setInterval(async () => {
      const pendingChanges = this.localStorageService.getPendingChanges();
      
      if (pendingChanges.length > 0) {
        Logger.debug('SyncManager', 'Periodic sync triggered', { pendingCount: pendingChanges.length });
        try {
          await this.syncPendingChanges();
        } catch (error) {
          Logger.error('SyncManager', 'Error during periodic sync', error);
        }
      }
    }, interval);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = null;
      Logger.info('SyncManager', 'Periodic sync stopped');
    }
  }

  /**
   * Register callback for sync completion
   */
  onSyncComplete(callback: SyncCompleteCallback): void {
    this.syncCompleteCallbacks.push(callback);
    Logger.debug('SyncManager', 'Sync complete callback registered');
  }

  /**
   * Unregister callback for sync completion
   */
  offSyncComplete(callback: SyncCompleteCallback): void {
    this.syncCompleteCallbacks = this.syncCompleteCallbacks.filter(cb => cb !== callback);
    Logger.debug('SyncManager', 'Sync complete callback unregistered');
  }

  /**
   * Notify all registered callbacks of sync completion
   */
  private notifySyncComplete(success: boolean, changesCount: number): void {
    this.syncCompleteCallbacks.forEach(callback => {
      try {
        callback(success, changesCount);
      } catch (error) {
        Logger.error('SyncManager', 'Error in sync complete callback', error);
      }
    });
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return this.syncingFlag;
  }

  /**
   * Get pending changes count
   */
  getPendingChangesCount(): number {
    return this.localStorageService.getPendingChanges().length;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPeriodicSync();
    this.syncCompleteCallbacks = [];
    Logger.info('SyncManager', 'SyncManager destroyed');
  }
}
