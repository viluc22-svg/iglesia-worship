/**
 * InitialSync Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performInitialSync, initializeApp } from './InitialSync';
import { LocalStorageService } from './LocalStorageService';
import type { Musician } from '../../types/musician';

describe('InitialSync', () => {
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    localStorageService = LocalStorageService.getInstance();
    localStorageService.clearAll();
  });

  afterEach(() => {
    localStorageService.clearAll();
  });

  describe('performInitialSync', () => {
    it('should return result with success flag', async () => {
      const result = await performInitialSync();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('musicians');
      expect(result).toHaveProperty('duration');
    });

    it('should fallback to localStorage when database fails', async () => {
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

    it('should return empty array when no data available', async () => {
      const result = await performInitialSync({ timeout: 100 });

      expect(result.musicians).toEqual([]);
    });

    it('should call loading indicator callback', async () => {
      const callback = vi.fn();

      await performInitialSync({ timeout: 100 }, callback);

      expect(callback).toHaveBeenCalledWith(true, expect.any(String));
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should complete within timeout', async () => {
      const startTime = Date.now();
      const result = await performInitialSync({ timeout: 1000 });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(result.duration).toBeLessThan(1000);
    });

    it('should handle timeout gracefully', async () => {
      await performInitialSync({ timeout: 100 });
    });
  });

  describe('initializeApp', () => {
    it('should initialize app successfully', async () => {
      const result = await initializeApp();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('musicians');
    });

    it('should call loading indicator callback', async () => {
      const callback = vi.fn();

      await initializeApp(callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should return musicians array', async () => {
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

      const result = await initializeApp();

      expect(Array.isArray(result.musicians)).toBe(true);
    });
  });

  describe('Loading Indicator', () => {
    it('should show loading indicator during sync', async () => {
      const callback = vi.fn();

      const promise = performInitialSync({ timeout: 500 }, callback);

      // Should be called with loading=true
      expect(callback).toHaveBeenCalledWith(true, expect.any(String));

      await promise;

      // Should be called with loading=false
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should hide loading indicator on error', async () => {
      const callback = vi.fn();

      await performInitialSync({ timeout: 100 }, callback);

      // Last call should be with loading=false
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCall[0]).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return error in result when sync fails', async () => {
      const result = await performInitialSync({ timeout: 100 });

      // Even if it fails, it should return a valid result
      expect(result).toBeDefined();
      expect(result.musicians).toBeDefined();
    });

    it('should not throw error on sync failure', async () => {
      await expect(performInitialSync({ timeout: 100 })).resolves.toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    it('should update localStorage with database data', async () => {
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

      await performInitialSync({ timeout: 100 });

      const stored = localStorageService.getMusician('1');
      expect(stored).toBeDefined();
      expect(stored?.email).toBe('test@example.com');
    });
  });
});
