/**
 * LocalStorageService
 * Manages local caching and offline-first functionality
 * Stores musicians and pending changes in browser localStorage
 */

import type { Musician, MusicianData, PendingChange } from '../../types/musician';
import { Logger } from '../../utils/logger';

const MUSICIANS_KEY = 'worship_musicians';
const PENDING_CHANGES_KEY = 'worship_pending_changes';

export class LocalStorageService {
  private static instance: LocalStorageService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  /**
   * Save or update a musician in localStorage
   */
  saveMusician(musician: Musician): void {
    try {
      const musicians = this.getMusicians();
      const index = musicians.findIndex(m => m.id === musician.id);

      if (index >= 0) {
        musicians[index] = musician;
      } else {
        musicians.push(musician);
      }

      localStorage.setItem(MUSICIANS_KEY, JSON.stringify(musicians));
      Logger.debug('LocalStorageService', 'Musician saved', { id: musician.id });
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to save musician', error);
    }
  }

  /**
   * Get all musicians from localStorage
   */
  getMusicians(): Musician[] {
    try {
      const data = localStorage.getItem(MUSICIANS_KEY);
      if (!data) return [];
      
      const musicians = JSON.parse(data) as Musician[];
      // Convert date strings back to Date objects
      return musicians.map(m => ({
        ...m,
        fechaRegistro: new Date(m.fechaRegistro),
        fechaActualizacion: new Date(m.fechaActualizacion),
      }));
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to get musicians', error);
      return [];
    }
  }

  /**
   * Get a single musician by ID
   */
  getMusician(id: string): Musician | null {
    try {
      const musicians = this.getMusicians();
      return musicians.find(m => m.id === id) || null;
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to get musician', error);
      return null;
    }
  }

  /**
   * Update a musician in localStorage
   */
  updateMusician(id: string, data: Partial<MusicianData>): void {
    try {
      const musicians = this.getMusicians();
      const index = musicians.findIndex(m => m.id === id);

      if (index >= 0) {
        musicians[index] = {
          ...musicians[index],
          email: data.email ?? musicians[index].email,
          nombre: data.nombre ?? musicians[index].nombre,
          instrumento: (data.instrumento as 'Guitarra' | 'Piano' | 'Bajo' | 'Batería' | 'Voz' | 'Director') ?? musicians[index].instrumento,
          contraseña: data.contraseña ?? musicians[index].contraseña,
          fechaActualizacion: new Date(),
        };
        localStorage.setItem(MUSICIANS_KEY, JSON.stringify(musicians));
        Logger.debug('LocalStorageService', 'Musician updated', { id });
      }
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to update musician', error);
    }
  }

  /**
   * Delete a musician from localStorage
   */
  deleteMusician(id: string): void {
    try {
      const musicians = this.getMusicians();
      const filtered = musicians.filter(m => m.id !== id);
      localStorage.setItem(MUSICIANS_KEY, JSON.stringify(filtered));
      Logger.debug('LocalStorageService', 'Musician deleted', { id });
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to delete musician', error);
    }
  }

  /**
   * Add a pending change to the queue
   */
  addPendingChange(change: PendingChange): void {
    try {
      const changes = this.getPendingChanges();
      changes.push(change);
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
      Logger.debug('LocalStorageService', 'Pending change added', { type: change.type });
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to add pending change', error);
    }
  }

  /**
   * Get all pending changes
   */
  getPendingChanges(): PendingChange[] {
    try {
      const data = localStorage.getItem(PENDING_CHANGES_KEY);
      if (!data) return [];
      
      const changes = JSON.parse(data) as PendingChange[];
      // Convert date strings back to Date objects
      return changes.map(c => ({
        ...c,
        timestamp: new Date(c.timestamp),
      }));
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to get pending changes', error);
      return [];
    }
  }

  /**
   * Remove a specific pending change
   */
  removePendingChange(changeId: string): void {
    try {
      const changes = this.getPendingChanges();
      const filtered = changes.filter(c => c.id !== changeId);
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(filtered));
      Logger.debug('LocalStorageService', 'Pending change removed', { changeId });
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to remove pending change', error);
    }
  }

  /**
   * Clear all pending changes
   */
  clearPendingChanges(): void {
    try {
      localStorage.removeItem(PENDING_CHANGES_KEY);
      Logger.debug('LocalStorageService', 'Pending changes cleared');
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to clear pending changes', error);
    }
  }

  /**
   * Clear all data (musicians and pending changes)
   */
  clearAll(): void {
    try {
      localStorage.removeItem(MUSICIANS_KEY);
      localStorage.removeItem(PENDING_CHANGES_KEY);
      Logger.debug('LocalStorageService', 'All data cleared');
    } catch (error) {
      Logger.error('LocalStorageService', 'Failed to clear all data', error);
    }
  }
}
