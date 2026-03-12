/**
 * ValidationService Tests
 * Unit tests for email, name, instrument, password validation
 */

import { ValidationService } from './ValidationService';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      const result = validationService.validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject email without @', () => {
      const result = validationService.validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject email without domain', () => {
      const result = validationService.validateEmail('user@');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty email', () => {
      const result = validationService.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject email with spaces', () => {
      const result = validationService.validateEmail('user @example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateName', () => {
    it('should validate name with valid length', () => {
      const result = validationService.validateName('Juan García');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject name too short', () => {
      const result = validationService.validateName('J');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject name too long', () => {
      const longName = 'a'.repeat(101);
      const result = validationService.validateName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty name', () => {
      const result = validationService.validateName('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept name with exactly 2 characters', () => {
      const result = validationService.validateName('Jo');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept name with exactly 100 characters', () => {
      const name = 'a'.repeat(100);
      const result = validationService.validateName(name);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateInstrument', () => {
    it('should validate valid instruments', () => {
      const instruments = ['Guitarra', 'Piano', 'Bajo', 'Batería', 'Voz', 'Director'];
      instruments.forEach(instrument => {
        const result = validationService.validateInstrument(instrument);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid instrument', () => {
      const result = validationService.validateInstrument('Trompeta');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty instrument', () => {
      const result = validationService.validateInstrument('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should be case-sensitive', () => {
      const result = validationService.validateInstrument('guitarra');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validatePassword', () => {
    it('should validate password with minimum length', () => {
      const result = validationService.validatePassword('123456');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password too short', () => {
      const result = validationService.validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty password', () => {
      const result = validationService.validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept long password', () => {
      const result = validationService.validatePassword('verylongpassword123456');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateMusician', () => {
    it('should validate complete musician data', () => {
      const data = {
        email: 'musician@example.com',
        nombre: 'Juan García',
        instrumento: 'Guitarra',
        contraseña: 'password123',
      };
      const result = validationService.validateMusician(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const data = {
        email: 'invalid-email',
        nombre: 'J',
        instrumento: 'Trompeta',
        contraseña: '123',
      };
      const result = validationService.validateMusician(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should validate role if provided', () => {
      const data = {
        email: 'musician@example.com',
        nombre: 'Juan García',
        instrumento: 'Guitarra',
        contraseña: 'password123',
        rol: 'admin' as const,
      };
      const result = validationService.validateMusician(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid role', () => {
      const data = {
        email: 'musician@example.com',
        nombre: 'Juan García',
        instrumento: 'Guitarra',
        contraseña: 'password123',
        rol: 'superadmin' as any,
      };
      const result = validationService.validateMusician(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('rol'))).toBe(true);
    });
  });

  describe('getValidationRules', () => {
    it('should return validation rules', () => {
      const rules = validationService.getValidationRules();
      expect(rules).toHaveProperty('email');
      expect(rules).toHaveProperty('name');
      expect(rules).toHaveProperty('password');
      expect(rules).toHaveProperty('instruments');
      expect(rules.instruments).toContain('Guitarra');
      expect(rules.instruments).toContain('Piano');
    });
  });
});
