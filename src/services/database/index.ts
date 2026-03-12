/**
 * Database Services Index
 * Central export point for all database services
 */

// Phase 1 Services
export { DatabaseService } from './DatabaseService';
export { LocalStorageService } from './LocalStorageService';

// Phase 2 Services
export { ValidationService } from './ValidationService';
export { ErrorHandler } from './ErrorHandler';
export type { ErrorNotification } from './ErrorHandler';

// Phase 3 Services
export { ConnectionManager } from './ConnectionManager';
export type { ConnectionChangeCallback } from './ConnectionManager';
export { SyncManager } from './SyncManager';
export type { SyncCompleteCallback } from './SyncManager';
export { performInitialSync, initializeApp } from './InitialSync';
export type { InitialSyncOptions, InitialSyncResult, LoadingIndicatorCallback } from './InitialSync';

// Error Types
export {
  CustomError,
  DatabaseError,
  ValidationError,
  ConnectionError,
  SyncError,
} from '../../types/errors';
