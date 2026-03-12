/**
 * Phase 2 Integration Tests
 * Tests for ValidationService and ErrorHandler integration
 */

import { ValidationService } from './ValidationService';
import { ErrorHandler } from './ErrorHandler';
import { ValidationError } from '../../types/errors';

describe('Phase 2 Integration', () => {
  let validationService: ValidationService;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearNotifications();
  });

  describe('Registration flow with validation and error handling', () => {
    it('should validate musician data and handle errors', () => {
      const invalidData = {
        email: 'invalid-email',
        nombre: 'J',
        instrumento: 'Trompeta',
        contraseña: '123',
      };

      const result = validationService.validateMusician(invalidData);
      expect(result.isValid).toBe(false);

      if (!result.isValid) {
        const error = new ValidationError(
          'Datos de músico inválidos',
          'musician',
          result.errors
        );
        errorHandler.handleValidationError(error);
      }

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
    });

    it('should successfully validate correct musician data', () => {
      const validData = {
        email: 'musician@example.com',
        nombre: 'Juan García',
        instrumento: 'Guitarra',
        contraseña: 'securePassword123',
      };

      const result = validationService.validateMusician(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        email: 'not-an-email',
        nombre: '',
        instrumento: 'InvalidInstrument',
        contraseña: '123',
      };

      const result = validationService.validateMusician(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);

      const error = new ValidationError(
        'Múltiples errores de validación',
        'musician',
        result.errors
      );
      errorHandler.handleValidationError(error);

      const notifications = errorHandler.getNotifications();
      expect(notifications[0].details).toContain(',');
    });
  });

  describe('Error notification flow', () => {
    it('should notify subscribers of validation errors', () => {
      const notificationSpy = vi.fn();
      errorHandler.onError(notificationSpy);

      const error = new ValidationError('Invalid email', 'email', ['Email format is invalid']);
      errorHandler.handleValidationError(error);

      expect(notificationSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'warning',
        message: 'Invalid email',
      }));
    });

    it('should maintain error history', () => {
      const data1 = { email: 'invalid', nombre: 'J', instrumento: 'X', contraseña: '123' };
      const data2 = { email: 'also-invalid', nombre: 'A', instrumento: 'Y', contraseña: '456' };

      const result1 = validationService.validateMusician(data1);
      const result2 = validationService.validateMusician(data2);

      errorHandler.handleValidationError(
        new ValidationError('Error 1', 'musician', result1.errors)
      );
      errorHandler.handleValidationError(
        new ValidationError('Error 2', 'musician', result2.errors)
      );

      const notifications = errorHandler.getNotifications();
      expect(notifications.length).toBe(2);
    });
  });

  describe('Validation rules accessibility', () => {
    it('should provide validation rules for UI', () => {
      const rules = validationService.getValidationRules();

      expect(rules.email).toBeDefined();
      expect(rules.name).toBeDefined();
      expect(rules.password).toBeDefined();
      expect(rules.instruments).toBeDefined();

      expect(rules.instruments).toContain('Guitarra');
      expect(rules.instruments).toContain('Piano');
      expect(rules.instruments).toContain('Bajo');
      expect(rules.instruments).toContain('Batería');
      expect(rules.instruments).toContain('Voz');
      expect(rules.instruments).toContain('Director');
    });
  });

  describe('Error statistics and monitoring', () => {
    it('should track error statistics', () => {
      const validData = {
        email: 'musician@example.com',
        nombre: 'Juan García',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };

      // Simulate some validation attempts
      for (let i = 0; i < 3; i++) {
        const result = validationService.validateMusician(validData);
        if (result.isValid) {
          // Success - no error
        }
      }

      // Simulate some validation failures
      const invalidData = {
        email: 'invalid',
        nombre: 'J',
        instrumento: 'Invalid',
        contraseña: '123',
      };

      for (let i = 0; i < 2; i++) {
        const result = validationService.validateMusician(invalidData);
        if (!result.isValid) {
          errorHandler.handleValidationError(
            new ValidationError('Validation failed', 'musician', result.errors)
          );
        }
      }

      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(2);
      expect(stats.warnings).toBe(2);
    });
  });

  describe('Validation edge cases', () => {
    it('should handle email with special characters', () => {
      const result = validationService.validateEmail('user+tag@example.co.uk');
      expect(result.isValid).toBe(true);
    });

    it('should handle names with accents', () => {
      const result = validationService.validateName('José María García');
      expect(result.isValid).toBe(true);
    });

    it('should handle whitespace in names', () => {
      const result = validationService.validateName('  Juan García  ');
      // Should still be valid as it's 13 characters including spaces
      expect(result.isValid).toBe(true);
    });

    it('should validate all valid instruments', () => {
      const instruments = ['Guitarra', 'Piano', 'Bajo', 'Batería', 'Voz', 'Director'];
      instruments.forEach(instrument => {
        const result = validationService.validateInstrument(instrument);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle password with special characters', () => {
      const result = validationService.validatePassword('P@ssw0rd!#$%');
      expect(result.isValid).toBe(true);
    });
  });
});
