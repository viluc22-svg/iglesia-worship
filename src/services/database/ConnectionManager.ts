/**
 * ConnectionManager
 * Manages database connection with automatic detection of connectivity changes
 * Implements exponential backoff retry strategy
 */

import { Logger } from '../../utils/logger';
import { ConnectionError } from '../../types/errors';

export type ConnectionChangeCallback = (connected: boolean) => void;

export class ConnectionManager {
  private static instance: ConnectionManager;
  private isConnectedFlag = false;
  private connectionChangeCallbacks: ConnectionChangeCallback[] = [];
  private retryTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;

  private constructor() {
    this.setupConnectivityListeners();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Setup listeners for online/offline events
   */
  private setupConnectivityListeners(): void {
    this.onlineListener = () => this.handleOnline();
    this.offlineListener = () => this.handleOffline();

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);

    // Initial connection check
    this.isConnectedFlag = navigator.onLine;
    Logger.info('ConnectionManager', 'Connectivity listeners setup', { initiallyOnline: this.isConnectedFlag });
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    Logger.info('ConnectionManager', 'Online event detected');
    this.setConnected(true);
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    Logger.info('ConnectionManager', 'Offline event detected');
    this.setConnected(false);
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      Logger.info('ConnectionManager', 'Attempting to connect to database');
      
      // Check if we have internet connectivity
      if (!navigator.onLine) {
        throw new ConnectionError('No internet connectivity', true);
      }

      // TODO: Implement actual database connection check
      // For now, we'll assume connection is successful if online
      this.setConnected(true);
      Logger.info('ConnectionManager', 'Successfully connected to database');
    } catch (error) {
      Logger.error('ConnectionManager', 'Failed to connect to database', error);
      this.setConnected(false);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  disconnect(): void {
    try {
      Logger.info('ConnectionManager', 'Disconnecting from database');
      this.setConnected(false);
      
      // Clear any pending retries
      this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
      this.retryTimeouts.clear();
      
      Logger.info('ConnectionManager', 'Successfully disconnected from database');
    } catch (error) {
      Logger.error('ConnectionManager', 'Error during disconnect', error);
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.isConnectedFlag && navigator.onLine;
  }

  /**
   * Set connection status and notify listeners
   */
  private setConnected(connected: boolean): void {
    const wasConnected = this.isConnectedFlag;
    this.isConnectedFlag = connected;

    if (wasConnected !== connected) {
      Logger.info('ConnectionManager', 'Connection status changed', { connected });
      this.notifyConnectionChange(connected);
    }
  }

  /**
   * Register callback for connection changes
   */
  onConnectionChange(callback: ConnectionChangeCallback): void {
    this.connectionChangeCallbacks.push(callback);
    Logger.debug('ConnectionManager', 'Connection change callback registered');
  }

  /**
   * Unregister callback for connection changes
   */
  offConnectionChange(callback: ConnectionChangeCallback): void {
    this.connectionChangeCallbacks = this.connectionChangeCallbacks.filter(cb => cb !== callback);
    Logger.debug('ConnectionManager', 'Connection change callback unregistered');
  }

  /**
   * Notify all registered callbacks of connection change
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionChangeCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        Logger.error('ConnectionManager', 'Error in connection change callback', error);
      }
    });
  }

  /**
   * Retry a function with exponential backoff
   * Retry strategy: 1s, 4s, then save to queue
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    operationId: string = 'operation'
  ): Promise<T> {
    const delays = [1000, 4000]; // 1s, 4s
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        Logger.debug('ConnectionManager', `Attempt ${attempt + 1}/${maxRetries} for ${operationId}`);
        const result = await fn();
        Logger.info('ConnectionManager', `Operation succeeded: ${operationId}`, { attempt: attempt + 1 });
        return result;
      } catch (error) {
        lastError = error as Error;
        Logger.warn('ConnectionManager', `Attempt ${attempt + 1} failed for ${operationId}`, error);

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries - 1) {
          const delay = delays[Math.min(attempt, delays.length - 1)];
          Logger.debug('ConnectionManager', `Waiting ${delay}ms before retry`, { operationId });
          
          await new Promise(resolve => {
            const timeout = setTimeout(resolve, delay);
            this.retryTimeouts.set(`${operationId}-${attempt}`, timeout);
          });
          
          this.retryTimeouts.delete(`${operationId}-${attempt}`);
        }
      }
    }

    // All retries exhausted
    const error = new ConnectionError(
      `Operation failed after ${maxRetries} retries: ${lastError?.message || 'Unknown error'}`,
      true
    );
    Logger.error('ConnectionManager', `All retries exhausted for ${operationId}`, error);
    throw error;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
    }
    
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.connectionChangeCallbacks = [];
    
    Logger.info('ConnectionManager', 'ConnectionManager destroyed');
  }
}
