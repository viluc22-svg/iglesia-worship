/**
 * ErrorHandler
 * Centralized error handling and logging
 * Manages different error types and user notifications
 */

import { Logger } from '../../utils/logger';
import {
  DatabaseError,
  ValidationError,
  ConnectionError,
  SyncError,
  CustomError,
} from '../../types/errors';

export interface ErrorNotification {
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorNotifications: ErrorNotification[] = [];
  private maxNotifications = 50;
  private errorCallbacks: ((notification: ErrorNotification) => void)[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Register callback for error notifications
   */
  onError(callback: (notification: ErrorNotification) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Unregister error callback
   */
  offError(callback: (notification: ErrorNotification) => void): void {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Notify all registered callbacks
   */
  private notifyError(notification: ErrorNotification): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        Logger.error('ErrorHandler', 'Error in notification callback', error);
      }
    });
  }

  /**
   * Add error notification
   */
  private addNotification(notification: ErrorNotification): void {
    this.errorNotifications.push(notification);

    // Keep notifications under max size
    if (this.errorNotifications.length > this.maxNotifications) {
      this.errorNotifications = this.errorNotifications.slice(-this.maxNotifications);
    }

    this.notifyError(notification);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: ValidationError | Error, context: string = 'ValidationService'): void {
    let message = 'Error de validación';
    let details = '';

    if (error instanceof ValidationError) {
      message = error.message;
      details = error.errors.join(', ');
      Logger.warn(context, message, { field: error.field, errors: error.errors });
    } else {
      message = error.message || 'Error desconocido de validación';
      Logger.warn(context, message, error);
    }

    const notification: ErrorNotification = {
      type: 'warning',
      message,
      details,
      timestamp: new Date(),
    };

    this.addNotification(notification);
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error: ConnectionError | Error, context: string = 'ConnectionManager'): void {
    let message = 'Error de conexión';
    let details = '';
    let isRetryable = true;

    if (error instanceof ConnectionError) {
      message = error.message;
      isRetryable = error.retryable;
      details = isRetryable ? 'Reintentando conexión...' : 'Error de conexión persistente';
      Logger.error(context, message, { retryable: isRetryable });
    } else {
      message = error.message || 'Error de conexión desconocido';
      Logger.error(context, message, error);
    }

    const notification: ErrorNotification = {
      type: isRetryable ? 'warning' : 'error',
      message,
      details,
      timestamp: new Date(),
    };

    this.addNotification(notification);
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: DatabaseError | Error, context: string = 'DatabaseService'): void {
    let message = 'Error de base de datos';
    let details = '';

    if (error instanceof DatabaseError) {
      message = error.message;
      Logger.error(context, message, error);
    } else {
      message = error.message || 'Error desconocido de base de datos';
      Logger.error(context, message, error);
    }

    const notification: ErrorNotification = {
      type: 'error',
      message,
      details,
      timestamp: new Date(),
    };

    this.addNotification(notification);
  }

  /**
   * Handle sync errors
   */
  handleSyncError(error: SyncError | Error, context: string = 'SyncManager'): void {
    let message = 'Error de sincronización';
    let details = '';

    if (error instanceof SyncError) {
      message = error.message;
      details = 'Los cambios se guardarán localmente y se sincronizarán cuando sea posible';
      Logger.warn(context, message, { conflictData: error.conflictData });
    } else {
      message = error.message || 'Error desconocido de sincronización';
      Logger.warn(context, message, error);
    }

    const notification: ErrorNotification = {
      type: 'warning',
      message,
      details,
      timestamp: new Date(),
    };

    this.addNotification(notification);
  }

  /**
   * Handle generic errors
   */
  handleError(error: Error, context: string = 'Application'): void {
    let message = 'Error desconocido';
    let errorType = 'error';

    if (error instanceof ValidationError) {
      this.handleValidationError(error, context);
      return;
    } else if (error instanceof ConnectionError) {
      this.handleConnectionError(error, context);
      return;
    } else if (error instanceof DatabaseError) {
      this.handleDatabaseError(error, context);
      return;
    } else if (error instanceof SyncError) {
      this.handleSyncError(error, context);
      return;
    } else if (error instanceof CustomError) {
      message = error.message;
      Logger.error(context, message, error);
    } else {
      message = error.message || 'Error desconocido';
      Logger.error(context, message, error);
    }

    const notification: ErrorNotification = {
      type: errorType as 'error' | 'warning' | 'info',
      message,
      timestamp: new Date(),
    };

    this.addNotification(notification);
  }

  /**
   * Log error for debugging
   */
  logError(error: Error, context: string = 'Application', additionalData?: any): void {
    Logger.error(context, error.message, {
      ...additionalData,
      stack: error.stack,
    });
  }

  /**
   * Get all error notifications
   */
  getNotifications(): ErrorNotification[] {
    return [...this.errorNotifications];
  }

  /**
   * Get recent error notifications
   */
  getRecentNotifications(count: number = 10): ErrorNotification[] {
    return this.errorNotifications.slice(-count);
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.errorNotifications = [];
  }

  /**
   * Clear notifications of specific type
   */
  clearNotificationsByType(type: 'error' | 'warning' | 'info'): void {
    this.errorNotifications = this.errorNotifications.filter(n => n.type !== type);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorNotifications.length,
      errors: 0,
      warnings: 0,
      info: 0,
    };

    this.errorNotifications.forEach(notification => {
      if (notification.type === 'error') stats.errors++;
      else if (notification.type === 'warning') stats.warnings++;
      else if (notification.type === 'info') stats.info++;
    });

    return stats;
  }

  /**
   * Export error log
   */
  exportErrorLog(): string {
    return JSON.stringify(this.errorNotifications, null, 2);
  }
}
