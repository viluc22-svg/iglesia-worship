/**
 * ConnectionManager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionManager } from './ConnectionManager';

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    connectionManager = ConnectionManager.getInstance();
    // Reset navigator.onLine for testing
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    connectionManager.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConnectionManager.getInstance();
      const instance2 = ConnectionManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Status', () => {
    it('should initialize with online status', () => {
      expect(connectionManager.isConnected()).toBe(true);
    });

    it('should update connection status when online event fires', async () => {
      const callback = vi.fn();
      connectionManager.onConnectionChange(callback);

      // Simulate online event
      window.dispatchEvent(new Event('online'));

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should update connection status when offline event fires', async () => {
      const callback = vi.fn();
      connectionManager.onConnectionChange(callback);

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  describe('Connection Change Callbacks', () => {
    it('should register and call connection change callback', async () => {
      const callback = vi.fn();
      connectionManager.onConnectionChange(callback);

      window.dispatchEvent(new Event('offline'));

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callback).toHaveBeenCalled();
    });

    it('should unregister connection change callback', async () => {
      const callback = vi.fn();
      connectionManager.onConnectionChange(callback);
      connectionManager.offConnectionChange(callback);

      window.dispatchEvent(new Event('offline'));

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple callbacks', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      connectionManager.onConnectionChange(callback1);
      connectionManager.onConnectionChange(callback2);

      window.dispatchEvent(new Event('offline'));

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Connect and Disconnect', () => {
    it('should connect successfully when online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      await connectionManager.connect();
      expect(connectionManager.isConnected()).toBe(true);
    });

    it('should fail to connect when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      await expect(connectionManager.connect()).rejects.toThrow();
    });

    it('should disconnect successfully', () => {
      connectionManager.disconnect();
      expect(connectionManager.isConnected()).toBe(false);
    });
  });

  describe('Retry with Backoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await connectionManager.retryWithBackoff(fn, 3, 'test');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const result = await connectionManager.retryWithBackoff(fn, 3, 'test');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      await expect(
        connectionManager.retryWithBackoff(fn, 2, 'test')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff delays', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await connectionManager.retryWithBackoff(fn, 3, 'test');
      const duration = Date.now() - startTime;

      // Should have delays of 1s and 4s = 5s minimum
      expect(duration).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      const callback = vi.fn();
      connectionManager.onConnectionChange(callback);

      connectionManager.destroy();

      window.dispatchEvent(new Event('offline'));

      await new Promise(resolve => setTimeout(resolve, 100));
      // Callback should not be called after destroy
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
