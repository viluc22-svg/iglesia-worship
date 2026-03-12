/**
 * ValidationService
 * Handles all data validation for musicians
 * Validates email, name, instrument, password, and email uniqueness
 */

import type { MusicianData, ValidationResult } from '../../types/musician';
import { ValidationError } from '../../types/errors';
import { Logger } from '../../utils/logger';
import { DatabaseService } from './DatabaseService';

// Validation constants
const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'El email debe tener un formato válido',
  },
  NAME: {
    minLength: 2,
    maxLength: 100,
    message: 'El nombre debe tener entre 2 y 100 caracteres',
  },
  PASSWORD: {
    minLength: 6,
    message: 'La contraseña debe tener al menos 6 caracteres',
  },
  INSTRUMENTS: ['Guitarra', 'Piano', 'Bajo', 'Batería', 'Voz', 'Director'],
};

export class ValidationService {
  private static instance: ValidationService;
  private databaseService: DatabaseService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || email.trim() === '') {
      errors.push('El email es requerido');
    } else if (!VALIDATION_RULES.EMAIL.pattern.test(email)) {
      errors.push(VALIDATION_RULES.EMAIL.message);
    }

    Logger.debug('ValidationService', 'Email validated', { email, isValid: errors.length === 0 });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate musician name
   */
  validateName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim() === '') {
      errors.push('El nombre es requerido');
    } else if (name.length < VALIDATION_RULES.NAME.minLength) {
      errors.push(`El nombre debe tener al menos ${VALIDATION_RULES.NAME.minLength} caracteres`);
    } else if (name.length > VALIDATION_RULES.NAME.maxLength) {
      errors.push(`El nombre no puede exceder ${VALIDATION_RULES.NAME.maxLength} caracteres`);
    }

    Logger.debug('ValidationService', 'Name validated', { name, isValid: errors.length === 0 });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate instrument selection
   */
  validateInstrument(instrument: string): ValidationResult {
    const errors: string[] = [];

    if (!instrument || instrument.trim() === '') {
      errors.push('El instrumento es requerido');
    } else if (!VALIDATION_RULES.INSTRUMENTS.includes(instrument)) {
      errors.push(`El instrumento debe ser uno de: ${VALIDATION_RULES.INSTRUMENTS.join(', ')}`);
    }

    Logger.debug('ValidationService', 'Instrument validated', { instrument, isValid: errors.length === 0 });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || password === '') {
      errors.push('La contraseña es requerida');
    } else if (password.length < VALIDATION_RULES.PASSWORD.minLength) {
      errors.push(VALIDATION_RULES.PASSWORD.message);
    }

    Logger.debug('ValidationService', 'Password validated', { isValid: errors.length === 0 });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate complete musician data
   */
  validateMusician(data: MusicianData): ValidationResult {
    const allErrors: string[] = [];

    // Validate each field
    const emailResult = this.validateEmail(data.email);
    const nameResult = this.validateName(data.nombre);
    const instrumentResult = this.validateInstrument(data.instrumento);
    const passwordResult = this.validatePassword(data.contraseña);

    // Collect all errors
    allErrors.push(...emailResult.errors);
    allErrors.push(...nameResult.errors);
    allErrors.push(...instrumentResult.errors);
    allErrors.push(...passwordResult.errors);

    // Validate role if provided
    if (data.rol && !['user', 'admin'].includes(data.rol)) {
      allErrors.push('El rol debe ser "user" o "admin"');
    }

    Logger.debug('ValidationService', 'Musician data validated', { isValid: allErrors.length === 0 });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Check if email is unique in the database
   */
  async isEmailUnique(email: string): Promise<boolean> {
    try {
      const isUnique = await this.databaseService.isEmailUnique(email);
      Logger.debug('ValidationService', 'Email uniqueness checked', { email, isUnique });
      return isUnique;
    } catch (error) {
      Logger.error('ValidationService', 'Failed to check email uniqueness', error);
      throw new ValidationError(
        'No se pudo verificar la unicidad del email',
        'email',
        ['Error al conectar con la base de datos']
      );
    }
  }

  /**
   * Validate musician data including email uniqueness
   */
  async validateMusicianComplete(data: MusicianData): Promise<ValidationResult> {
    // First validate format
    const formatResult = this.validateMusician(data);
    if (!formatResult.isValid) {
      return formatResult;
    }

    // Then check email uniqueness
    try {
      const isUnique = await this.isEmailUnique(data.email);
      if (!isUnique) {
        return {
          isValid: false,
          errors: ['Este email ya está registrado en el sistema'],
        };
      }
    } catch (error) {
      Logger.error('ValidationService', 'Email uniqueness check failed', error);
      return {
        isValid: false,
        errors: ['Error al verificar la disponibilidad del email'],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Get validation rules (for UI display)
   */
  getValidationRules() {
    return {
      email: VALIDATION_RULES.EMAIL,
      name: VALIDATION_RULES.NAME,
      password: VALIDATION_RULES.PASSWORD,
      instruments: VALIDATION_RULES.INSTRUMENTS,
    };
  }
}
