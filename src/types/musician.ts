/**
 * Musician entity interface
 * Represents a registered musician in the system
 */
export interface Musician {
  id: string;
  email: string;
  nombre: string;
  instrumento: 'Guitarra' | 'Piano' | 'Bajo' | 'Batería' | 'Voz' | 'Director';
  rol: 'user' | 'admin';
  fechaRegistro: Date;
  fechaActualizacion: Date;
  contraseña: string; // Hash bcrypt (never plain text)
}

/**
 * Data for creating or updating a musician
 * Used in registration and update forms
 */
export interface MusicianData {
  email: string;
  nombre: string;
  instrumento: string;
  contraseña: string;
  rol?: 'user' | 'admin';
}

/**
 * Represents a pending change waiting to be synced
 * Used for offline-first functionality
 */
export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  musicianId: string;
  data: Partial<MusicianData>;
  timestamp: Date;
  retries: number;
}

/**
 * Result of validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Custom validation error
 */
export interface ValidationError extends Error {
  field: string;
  message: string;
}
