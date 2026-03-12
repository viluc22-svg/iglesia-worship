/**
 * InitialSync
 * Handles initial synchronization when app starts
 * Downloads all musicians from database and updates localStorage
 * Falls back to localStorage if database is unavailable
 */

import type { Musician } from '../../types/musician';
import { Logger } from '../../utils/logger';
import { DatabaseService } from './DatabaseService';
import { LocalStorageService } from './LocalStorageService';
import { ErrorHandler } from './ErrorHandler';

export interface InitialSyncOptions {
  timeout?: number; // Timeout in milliseconds (default: 3000)
  showLoadingIndicator?: boolean; // Whether to show loading indicator
}

export interface InitialSyncResult {
  success: boolean;
  source: 'database' | 'localStorage';
  musicians: Musician[];
  duration: number;
  error?: Error;
}

export type LoadingIndicatorCallback = (loading: boolean, message?: string) => void;

/**
 * Perform initial synchronization
 */
export async function performInitialSync(
  options: InitialSyncOptions = {},
  onLoadingChange?: LoadingIndicatorCallback
): Promise<InitialSyncResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 3000;
  const databaseService = DatabaseService.getInstance();
  const localStorageService = LocalStorageService.getInstance();
  const errorHandler = ErrorHandler.getInstance();

  try {
    Logger.info('InitialSync', 'Starting initial synchronization', { timeout });
    
    if (onLoadingChange) {
      onLoadingChange(true, 'Sincronizando datos...');
    }

    // Try to fetch from database with timeout
    let musicians: Musician[] = [];
    let source: 'database' | 'localStorage' = 'localStorage';

    try {
      const syncPromise = databaseService.getMusicians();
      const timeoutPromise = new Promise<Musician[]>((_, reject) =>
        setTimeout(() => reject(new Error('Sync timeout')), timeout)
      );

      musicians = await Promise.race([syncPromise, timeoutPromise]);
      source = 'database';

      Logger.info('InitialSync', 'Successfully synced from database', { count: musicians.length });

      // Update localStorage with fresh data
      musicians.forEach(musician => {
        localStorageService.saveMusician(musician);
      });

      Logger.debug('InitialSync', 'Updated localStorage with database data');
    } catch (error) {
      Logger.warn('InitialSync', 'Failed to sync from database, falling back to localStorage', error);

      // Fallback to localStorage
      musicians = localStorageService.getMusicians();
      source = 'localStorage';

      if (musicians.length === 0) {
        Logger.info('InitialSync', 'No data available in localStorage');
      } else {
        Logger.info('InitialSync', 'Loaded from localStorage', { count: musicians.length });
      }
    }

    const duration = Date.now() - startTime;

    if (onLoadingChange) {
      onLoadingChange(false);
    }

    Logger.info('InitialSync', 'Initial synchronization completed', {
      source,
      count: musicians.length,
      duration,
    });

    return {
      success: true,
      source,
      musicians,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error('InitialSync', 'Initial synchronization failed', error);

    if (onLoadingChange) {
      onLoadingChange(false);
    }

    // Try to load from localStorage as last resort
    const musicians = localStorageService.getMusicians();

    errorHandler.handleError(error as Error, 'InitialSync');

    return {
      success: false,
      source: 'localStorage',
      musicians,
      duration,
      error: error as Error,
    };
  }
}

/**
 * Initialize app with sync and connection monitoring
 * This is the main entry point for app initialization
 */
export async function initializeApp(
  onLoadingChange?: LoadingIndicatorCallback
): Promise<InitialSyncResult> {
  try {
    Logger.info('InitializeApp', 'Initializing application');

    // Perform initial sync
    const syncResult = await performInitialSync(
      { timeout: 3000, showLoadingIndicator: true },
      onLoadingChange
    );

    Logger.info('InitializeApp', 'Application initialized', {
      source: syncResult.source,
      musicianCount: syncResult.musicians.length,
    });

    return syncResult;
  } catch (error) {
    Logger.error('InitializeApp', 'Failed to initialize application', error);
    throw error;
  }
}
