/**
 * Phase 4 Integration
 * Integrates database services with the main application
 * Provides wrapper functions for registration and musician management
 */

import { DatabaseService } from './DatabaseService';
import { LocalStorageService } from './LocalStorageService';
import { ValidationService } from './ValidationService';
import { ErrorHandler } from './ErrorHandler';
import { ConnectionManager } from './ConnectionManager';
import { SyncManager } from './SyncManager';
import { Logger } from '../../utils/logger';
import type { Musician, MusicianData } from '../../types/musician';

// Legacy User interface for compatibility
interface User {
  email: string;
  name: string;
  instrument: string;
  password?: string;
  role: 'user' | 'admin';
  lastActive?: number;
}

/**
 * Convert legacy User to Musician format
 */
export function userToMusician(user: User): Musician {
  return {
    id: `legacy-${user.email}`,
    email: user.email,
    nombre: user.name,
    instrumento: user.instrument as any,
    rol: user.role,
    fechaRegistro: new Date(),
    fechaActualizacion: new Date(),
    contraseña: user.password || '',
  };
}

/**
 * Convert Musician to legacy User format
 */
export function musicianToUser(musician: Musician): User {
  return {
    email: musician.email,
    name: musician.nombre,
    instrument: musician.instrumento,
    password: musician.contraseña,
    role: musician.rol,
  };
}

/**
 * Register a new user with database integration
 */
export async function registerUserWithDB(userData: {
  email: string;
  name: string;
  instrument: string;
  password: string;
}): Promise<{ success: boolean; message: string; user?: Musician }> {
  try {
    const db = DatabaseService.getInstance();
    const validator = ValidationService.getInstance();
    const localStorage = LocalStorageService.getInstance();
    const errorHandler = ErrorHandler.getInstance();

    // Validate data
    const musicianData: MusicianData = {
      email: userData.email,
      nombre: userData.name,
      instrumento: userData.instrument,
      contraseña: userData.password,
      rol: 'user',
    };

    const validation = validator.validateMusician(musicianData);
    if (!validation.isValid) {
      Logger.warn('Phase4Integration', 'Registration validation failed', {
        errors: validation.errors,
      });
      return {
        success: false,
        message: validation.errors.join('. '),
      };
    }

    // Check email uniqueness
    try {
      const isUnique = await validator.isEmailUnique(userData.email);
      if (!isUnique) {
        Logger.warn('Phase4Integration', 'Email already registered', { email: userData.email });
        return {
          success: false,
          message: 'Este correo ya está registrado',
        };
      }
    } catch (error) {
      Logger.warn('Phase4Integration', 'Could not verify email uniqueness, proceeding offline', {
        error,
      });
    }

    // Try to create in database
    let musician: Musician | null = null;
    try {
      if (db.isConnected()) {
        musician = await db.createMusician(musicianData);
        Logger.info('Phase4Integration', 'User registered in database', { email: userData.email });
      }
    } catch (error) {
      Logger.warn('Phase4Integration', 'Failed to register in database, saving locally', { error });
      errorHandler.handleError(error as Error, 'User registration');
    }

    // Save to localStorage
    if (!musician) {
      musician = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        nombre: userData.name,
        instrumento: userData.instrument as any,
        rol: 'user',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
        contraseña: userData.password,
      };
    }

    localStorage.saveMusician(musician);
    Logger.info('Phase4Integration', 'User registered successfully', { email: userData.email });

    return {
      success: true,
      message: 'Cuenta creada con éxito',
      user: musician,
    };
  } catch (error) {
    Logger.error('Phase4Integration', 'Registration failed', error);
    return {
      success: false,
      message: 'Error al registrar usuario',
    };
  }
}

/**
 * Create a musician with database integration
 */
export async function createMusicianWithDB(data: {
  name: string;
  email: string;
  instrument: string;
  password: string;
}): Promise<{ success: boolean; message: string; musician?: Musician }> {
  try {
    const db = DatabaseService.getInstance();
    const validator = ValidationService.getInstance();
    const localStorage = LocalStorageService.getInstance();
    const errorHandler = ErrorHandler.getInstance();

    // Validate data
    const musicianData: MusicianData = {
      email: data.email,
      nombre: data.name,
      instrumento: data.instrument,
      contraseña: data.password,
      rol: 'user',
    };

    const validation = validator.validateMusician(musicianData);
    if (!validation.isValid) {
      Logger.warn('Phase4Integration', 'Musician creation validation failed', {
        errors: validation.errors,
      });
      return {
        success: false,
        message: validation.errors.join('. '),
      };
    }

    // Check email uniqueness
    try {
      const isUnique = await validator.isEmailUnique(data.email);
      if (!isUnique) {
        Logger.warn('Phase4Integration', 'Email already in use', { email: data.email });
        return {
          success: false,
          message: 'Este correo ya está registrado',
        };
      }
    } catch (error) {
      Logger.warn('Phase4Integration', 'Could not verify email uniqueness', { error });
    }

    // Try to create in database
    let musician: Musician | null = null;
    try {
      if (db.isConnected()) {
        musician = await db.createMusician(musicianData);
        Logger.info('Phase4Integration', 'Musician created in database', { email: data.email });
      }
    } catch (error) {
      Logger.warn('Phase4Integration', 'Failed to create in database, saving locally', { error });
      errorHandler.handleError(error as Error, 'Musician creation');
    }

    // Save to localStorage
    if (!musician) {
      musician = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: data.email,
        nombre: data.name,
        instrumento: data.instrument as any,
        rol: 'user',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
        contraseña: data.password,
      };
    }

    localStorage.saveMusician(musician);
    Logger.info('Phase4Integration', 'Musician created successfully', { email: data.email });

    return {
      success: true,
      message: 'Músico creado exitosamente',
      musician,
    };
  } catch (error) {
    Logger.error('Phase4Integration', 'Musician creation failed', error);
    return {
      success: false,
      message: 'Error al crear músico',
    };
  }
}

/**
 * Update a musician with database integration
 */
export async function updateMusicianWithDB(
  email: string,
  data: { name: string; email: string; instrument: string }
): Promise<{ success: boolean; message: string; musician?: Musician }> {
  try {
    const db = DatabaseService.getInstance();
    const validator = ValidationService.getInstance();
    const localStorage = LocalStorageService.getInstance();
    const errorHandler = ErrorHandler.getInstance();

    // Validate data
    const musicianData: MusicianData = {
      email: data.email,
      nombre: data.name,
      instrumento: data.instrument,
      contraseña: '', // Not updating password
    };

    const validation = validator.validateMusician(musicianData);
    if (!validation.isValid) {
      Logger.warn('Phase4Integration', 'Musician update validation failed', {
        errors: validation.errors,
      });
      return {
        success: false,
        message: validation.errors.join('. '),
      };
    }

    // Check email uniqueness (excluding current musician)
    try {
      const musicians = localStorage.getMusicians();
      const currentMusician = musicians.find(m => m.email === email);
      if (!currentMusician) {
        return {
          success: false,
          message: 'Músico no encontrado',
        };
      }

      const isUnique = !musicians.some(m => m.email === data.email && m.email !== email);
      if (!isUnique) {
        Logger.warn('Phase4Integration', 'Email already in use', { email: data.email });
        return {
          success: false,
          message: 'Este correo ya está en uso por otro músico',
        };
      }
    } catch (error) {
      Logger.warn('Phase4Integration', 'Could not verify email uniqueness', { error });
    }

    // Try to update in database
    let musician: Musician | undefined;
    try {
      if (db.isConnected()) {
        const musicians = await db.getMusicians();
        const currentMusician = musicians.find(m => m.email === email);
        if (currentMusician) {
          musician = await db.updateMusician(currentMusician.id, {
            nombre: data.name,
            email: data.email,
            instrumento: data.instrument,
          });
          Logger.info('Phase4Integration', 'Musician updated in database', { email: data.email });
        }
      }
    } catch (error) {
      Logger.warn('Phase4Integration', 'Failed to update in database, saving locally', { error });
      errorHandler.handleError(error as Error, 'Musician update');
    }

    // Update in localStorage
    const musicians = localStorage.getMusicians();
    const currentMusician = musicians.find(m => m.email === email);
    if (currentMusician) {
      currentMusician.nombre = data.name;
      currentMusician.email = data.email;
      currentMusician.instrumento = data.instrument as any;
      currentMusician.fechaActualizacion = new Date();
      localStorage.saveMusician(currentMusician);
      musician = currentMusician;
    }

    Logger.info('Phase4Integration', 'Musician updated successfully', { email: data.email });

    return {
      success: true,
      message: 'Músico actualizado exitosamente',
      musician,
    };
  } catch (error) {
    Logger.error('Phase4Integration', 'Musician update failed', error);
    return {
      success: false,
      message: 'Error al actualizar músico',
    };
  }
}

/**
 * Delete a musician with database integration
 */
export async function deleteMusicianWithDB(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const db = DatabaseService.getInstance();
    const localStorage = LocalStorageService.getInstance();
    const errorHandler = ErrorHandler.getInstance();

    // Check if musician exists and is not admin
    const musicians = localStorage.getMusicians();
    const musician = musicians.find(m => m.email === email);

    if (!musician) {
      return {
        success: false,
        message: 'Músico no encontrado',
      };
    }

    if (musician.rol === 'admin') {
      return {
        success: false,
        message: 'No se puede eliminar un administrador',
      };
    }

    // Try to delete from database
    try {
      if (db.isConnected()) {
        await db.deleteMusician(musician.id);
        Logger.info('Phase4Integration', 'Musician deleted from database', { email });
      }
    } catch (error) {
      Logger.warn('Phase4Integration', 'Failed to delete from database, removing locally', {
        error,
      });
      errorHandler.handleError(error as Error, 'Musician deletion');
    }

    // Delete from localStorage
    localStorage.deleteMusician(musician.id);
    Logger.info('Phase4Integration', 'Musician deleted successfully', { email });

    return {
      success: true,
      message: 'Músico eliminado exitosamente',
    };
  } catch (error) {
    Logger.error('Phase4Integration', 'Musician deletion failed', error);
    return {
      success: false,
      message: 'Error al eliminar músico',
    };
  }
}

/**
 * Load musicians from database or localStorage
 */
export async function loadMusicians(): Promise<Musician[]> {
  try {
    const db = DatabaseService.getInstance();
    const localStorage = LocalStorageService.getInstance();
    const connectionManager = ConnectionManager.getInstance();

    let musicians: Musician[] = [];

    if (connectionManager.isConnected() && db.isConnected()) {
      try {
        musicians = await db.getMusicians();
        // Update localStorage with fresh data
        musicians.forEach(m => localStorage.saveMusician(m));
        Logger.info('Phase4Integration', 'Musicians loaded from database', {
          count: musicians.length,
        });
      } catch (error) {
        Logger.warn('Phase4Integration', 'Failed to load from database, using localStorage', {
          error,
        });
        musicians = localStorage.getMusicians();
      }
    } else {
      musicians = localStorage.getMusicians();
      Logger.info('Phase4Integration', 'Musicians loaded from localStorage', {
        count: musicians.length,
      });
    }

    return musicians;
  } catch (error) {
    Logger.error('Phase4Integration', 'Failed to load musicians', error);
    return [];
  }
}

/**
 * Initialize database services for the application
 */
export function initializeDatabaseServices(): void {
  try {
    const connectionManager = ConnectionManager.getInstance();
    const syncManager = SyncManager.getInstance();

    // Setup connection change listener
    connectionManager.onConnectionChange((connected: boolean) => {
      Logger.info('Phase4Integration', 'Connection status changed', { connected });

      if (connected) {
        // Trigger sync when connection is restored
        syncManager.syncPendingChanges().catch(error => {
          Logger.error('Phase4Integration', 'Sync failed after connection restored', error);
        });
      }
    });

    // Start periodic sync
    syncManager.startPeriodicSync(30000); // Every 30 seconds

    Logger.info('Phase4Integration', 'Database services initialized');
  } catch (error) {
    Logger.error('Phase4Integration', 'Failed to initialize database services', error);
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean;
  isOnline: boolean;
} {
  const connectionManager = ConnectionManager.getInstance();

  return {
    isConnected: connectionManager.isConnected(),
    isOnline: navigator.onLine,
  };
}

/**
 * Subscribe to connection changes
 */
export function onConnectionChange(callback: (connected: boolean) => void): void {
  const connectionManager = ConnectionManager.getInstance();
  connectionManager.onConnectionChange(callback);
}
