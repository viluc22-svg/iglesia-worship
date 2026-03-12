/**
 * ErrorHandler Tests
 * Unit tests for error handling and notifications
 */

import { ErrorHandler } from './ErrorHandler';
import { ValidationError, ConnectionError, DatabaseError, SyncError } from '../../types/errors';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearNotifications();
  });

  describe('handleValidationError', () => {
    it('should handle ValidationError', () => {
      const error = new ValidationError('Invalid email', 'email', ['Email format is invalid']);
      errorHandler.handleValidationError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toBe('Invalid email');
    });

    it('should handle generic Error as validation error', () => {
      const error = new Error('Validation failed');
      errorHandler.handleValidationError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
    });
  });

  describe('handleConnectionError', () => {
    it('should handle retryable ConnectionError', () => {
      const error = new ConnectionError('Connection timeout', true);
      errorHandler.handleConnectionError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].details).toContain('Reintentando');
    });

    it('should handle non-retryable ConnectionError', () => {
      const error = new ConnectionError('Connection refused', false);
      errorHandler.handleConnectionError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].details).toContain('persistente');
    });
  });

  describe('handleDatabaseError', () => {
    it('should handle DatabaseError', () => {
      const error = new DatabaseError('Database connection failed');
      errorHandler.handleDatabaseError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
    });
  });

  describe('handleSyncError', () => {
    it('should handle SyncError', () => {
      const error = new SyncError('Sync conflict detected', { local: {}, remote: {} });
      errorHandler.handleSyncError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].details).toContain('localmente');
    });
  });

  describe('handleError', () => {
    it('should route ValidationError to handleValidationError', () => {
      const error = new ValidationError('Invalid data', 'field');
      errorHandler.handleError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
    });

    it('should route ConnectionError to handleConnectionError', () => {
      const error = new ConnectionError('Connection lost');
      errorHandler.handleError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
    });

    it('should route DatabaseError to handleDatabaseError', () => {
      const error = new DatabaseError('DB error');
      errorHandler.handleError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
    });

    it('should route SyncError to handleSyncError', () => {
      const error = new SyncError('Sync failed');
      errorHandler.handleError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
    });

    it('should handle generic Error', () => {
      const error = new Error('Unknown error');
      errorHandler.handleError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
    });
  });

  describe('error callbacks', () => {
    it('should call registered callbacks on error', () => {
      const callback = vi.fn();
      errorHandler.onError(callback);

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        message: 'Test error',
      }));
    });

    it('should unregister callbacks', () => {
      const callback = vi.fn();
      errorHandler.onError(callback);
      errorHandler.offError(callback);

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const badCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      errorHandler.onError(badCallback);

      const error = new Error('Test error');
      expect(() => errorHandler.handleError(error)).not.toThrow();
    });
  });

  describe('notification management', () => {
    it('should get all notifications', () => {
      errorHandler.handleError(new Error('Error 1'));
      errorHandler.handleError(new Error('Error 2'));

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(2);
    });

    it('should get recent notifications', () => {
      for (let i = 0; i < 15; i++) {
        errorHandler.handleError(new Error(`Error ${i}`));
      }

      const recent = errorHandler.getRecentNotifications(5);
      expect(recent.length).toBe(5);
    });

    it('should clear all notifications', () => {
      errorHandler.handleError(new Error('Error 1'));
      errorHandler.handleError(new Error('Error 2'));

      errorHandler.clearNotifications();
      expect(errorHandler.getNotifications().length).toBe(0);
    });

    it('should clear notifications by type', () => {
      errorHandler.handleError(new Error('Error'));
      errorHandler.handleValidationError(new ValidationError('Validation error', 'field'));

      errorHandler.clearNotificationsByType('error');
      const notifications = errorHandler.getNotifications();
      expect(notifications.every(n => n.type !== 'error')).toBe(true);
    });
  });

  describe('error statistics', () => {
    it('should calculate error statistics', () => {
      errorHandler.handleError(new Error('Error 1'));
      errorHandler.handleError(new Error('Error 2'));
      errorHandler.handleValidationError(new ValidationError('Validation error', 'field'));

      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(3);
      expect(stats.errors).toBe(2);
      expect(stats.warnings).toBe(1);
    });
  });

  describe('error export', () => {
    it('should export error log as JSON', () => {
      errorHandler.handleError(new Error('Test error'));

      const exported = errorHandler.exportErrorLog();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });
  });

  describe('notification timestamps', () => {
    it('should add timestamp to notifications', () => {
      const beforeTime = new Date();
      errorHandler.handleError(new Error('Test error'));
      const afterTime = new Date();

      const notifications = errorHandler.getNotifications();
      expect(notifications[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(notifications[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
