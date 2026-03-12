/**
 * Phase 4 Integration Tests
 * Tests for database integration with registration and musician management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerUserWithDB,
  createMusicianWithDB,
  updateMusicianWithDB,
  deleteMusicianWithDB,
  loadMusicians,
  userToMusician,
  musicianToUser,
} from './Phase4Integration';
import { LocalStorageService } from './LocalStorageService';
import type { Musician } from '../../types/musician';

describe('Phase4Integration', () => {
  let localStorage: LocalStorageService;

  beforeEach(() => {
    localStorage = LocalStorageService.getInstance();
    localStorage.clearAll();
  });

  describe('userToMusician', () => {
    it('should convert User to Musician format', () => {
      const user = {
        email: 'test@example.com',
        name: 'Test User',
        instrument: 'Guitarra',
        password: 'password123',
        role: 'user' as const,
      };

      const musician = userToMusician(user);

      expect(musician.email).toBe(user.email);
      expect(musician.nombre).toBe(user.name);
      expect(musician.instrumento).toBe(user.instrument);
      expect(musician.contraseña).toBe(user.password);
      expect(musician.rol).toBe(user.role);
    });
  });

  describe('musicianToUser', () => {
    it('should convert Musician to User format', () => {
      const musician: Musician = {
        id: 'test-id',
        email: 'test@example.com',
        nombre: 'Test Musician',
        instrumento: 'Piano',
        rol: 'user',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
        contraseña: 'password123',
      };

      const user = musicianToUser(musician);

      expect(user.email).toBe(musician.email);
      expect(user.name).toBe(musician.nombre);
      expect(user.instrument).toBe(musician.instrumento);
      expect(user.password).toBe(musician.contraseña);
      expect(user.role).toBe(musician.rol);
    });
  });

  describe('registerUserWithDB', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        instrument: 'Guitarra',
        password: 'password123',
      };

      const result = await registerUserWithDB(userData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('éxito');
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(userData.email);
    });

    it('should reject invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'New User',
        instrument: 'Guitarra',
        password: 'password123',
      };

      const result = await registerUserWithDB(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('email');
    });

    it('should reject short password', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'New User',
        instrument: 'Guitarra',
        password: 'short',
      };

      const result = await registerUserWithDB(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('contraseña');
    });

    it('should reject short name', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'A',
        instrument: 'Guitarra',
        password: 'password123',
      };

      const result = await registerUserWithDB(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('nombre');
    });

    it('should save user to localStorage', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        instrument: 'Piano',
        password: 'password123',
      };

      await registerUserWithDB(userData);

      const musicians = localStorage.getMusicians();
      expect(musicians.length).toBeGreaterThan(0);
      expect(musicians.some(m => m.email === userData.email)).toBe(true);
    });
  });

  describe('createMusicianWithDB', () => {
    it('should create a musician successfully', async () => {
      const data = {
        name: 'Test Musician',
        email: 'musician@example.com',
        instrument: 'Guitarra',
        password: 'password123',
      };

      const result = await createMusicianWithDB(data);

      expect(result.success).toBe(true);
      expect(result.message).toContain('exitosamente');
      expect(result.musician).toBeDefined();
      expect(result.musician?.email).toBe(data.email);
    });

    it('should reject invalid instrument', async () => {
      const data = {
        name: 'Test Musician',
        email: 'musician@example.com',
        instrument: 'InvalidInstrument',
        password: 'password123',
      };

      const result = await createMusicianWithDB(data);

      expect(result.success).toBe(false);
      expect(result.message).toContain('instrumento');
    });

    it('should save musician to localStorage', async () => {
      const data = {
        name: 'Test Musician',
        email: 'musician@example.com',
        instrument: 'Piano',
        password: 'password123',
      };

      await createMusicianWithDB(data);

      const musicians = localStorage.getMusicians();
      expect(musicians.some(m => m.email === data.email)).toBe(true);
    });
  });

  describe('updateMusicianWithDB', () => {
    it('should update a musician successfully', async () => {
      // First create a musician
      const createData = {
        name: 'Original Name',
        email: 'musician@example.com',
        instrument: 'Guitarra',
        password: 'password123',
      };

      await createMusicianWithDB(createData);

      // Then update it
      const updateData = {
        name: 'Updated Name',
        email: 'musician@example.com',
        instrument: 'Piano',
      };

      const result = await updateMusicianWithDB(createData.email, updateData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('actualizado');
      expect(result.musician?.nombre).toBe(updateData.name);
      expect(result.musician?.instrumento).toBe(updateData.instrument);
    });

    it('should reject non-existent musician', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'nonexistent@example.com',
        instrument: 'Piano',
      };

      const result = await updateMusicianWithDB('nonexistent@example.com', updateData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('no encontrado');
    });

    it('should update localStorage', async () => {
      // Create a musician
      const createData = {
        name: 'Original Name',
        email: 'musician@example.com',
        instrument: 'Guitarra',
        password: 'password123',
      };

      await createMusicianWithDB(createData);

      // Update it
      const updateData = {
        name: 'Updated Name',
        email: 'musician@example.com',
        instrument: 'Piano',
      };

      await updateMusicianWithDB(createData.email, updateData);

      const musicians = localStorage.getMusicians();
      const updated = musicians.find(m => m.email === createData.email);
      expect(updated?.nombre).toBe(updateData.name);
    });
  });

  describe('deleteMusicianWithDB', () => {
    it('should delete a musician successfully', async () => {
      // First create a musician
      const createData = {
        name: 'Test Musician',
        email: 'musician@example.com',
        instrument: 'Guitarra',
        password: 'password123',
      };

      await createMusicianWithDB(createData);

      // Then delete it
      const result = await deleteMusicianWithDB(createData.email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('eliminado');
    });

    it('should remove from localStorage', async () => {
      // Create a musician
      const createData = {
        name: 'Test Musician',
        email: 'musician@example.com',
        instrument: 'Guitarra',
        password: 'password123',
      };

      await createMusicianWithDB(createData);

      // Delete it
      await deleteMusicianWithDB(createData.email);

      const musicians = localStorage.getMusicians();
      expect(musicians.some(m => m.email === createData.email)).toBe(false);
    });

    it('should reject deletion of non-existent musician', async () => {
      const result = await deleteMusicianWithDB('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('no encontrado');
    });
  });

  describe('loadMusicians', () => {
    it('should load musicians from localStorage', async () => {
      // Create some musicians
      const data1 = {
        name: 'Musician 1',
        email: 'musician1@example.com',
        instrument: 'Guitarra',
        password: 'password123',
      };

      const data2 = {
        name: 'Musician 2',
        email: 'musician2@example.com',
        instrument: 'Piano',
        password: 'password123',
      };

      await createMusicianWithDB(data1);
      await createMusicianWithDB(data2);

      // Load musicians
      const musicians = await loadMusicians();

      expect(musicians.length).toBeGreaterThanOrEqual(2);
      expect(musicians.some(m => m.email === data1.email)).toBe(true);
      expect(musicians.some(m => m.email === data2.email)).toBe(true);
    });

    it('should return empty array if no musicians', async () => {
      const musicians = await loadMusicians();

      expect(Array.isArray(musicians)).toBe(true);
    });
  });

  describe('Email Uniqueness', () => {
    it('should reject duplicate email on registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'User 1',
        instrument: 'Guitarra',
        password: 'password123',
      };

      // Register first user
      await registerUserWithDB(userData);

      // Try to register with same email
      const result = await registerUserWithDB(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('registrado');
    });

    it('should reject duplicate email on musician creation', async () => {
      const data = {
        name: 'Musician 1',
        email: 'musician@example.com',
        instrument: 'Guitarra',
        password: 'password123',
      };

      // Create first musician
      await createMusicianWithDB(data);

      // Try to create with same email
      const result = await createMusicianWithDB(data);

      expect(result.success).toBe(false);
      expect(result.message).toContain('registrado');
    });
  });

  describe('Validation', () => {
    it('should validate all required fields', async () => {
      const invalidData = {
        name: '',
        email: '',
        instrument: '',
        password: '',
      };

      const result = await createMusicianWithDB(invalidData);

      expect(result.success).toBe(false);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should validate email format', async () => {
      const data = {
        name: 'Test',
        email: 'not-an-email',
        instrument: 'Guitarra',
        password: 'password123',
      };

      const result = await createMusicianWithDB(data);

      expect(result.success).toBe(false);
      expect(result.message).toContain('email');
    });

    it('should validate instrument selection', async () => {
      const data = {
        name: 'Test',
        email: 'test@example.com',
        instrument: 'InvalidInstrument',
        password: 'password123',
      };

      const result = await createMusicianWithDB(data);

      expect(result.success).toBe(false);
      expect(result.message).toContain('instrumento');
    });
  });
});
