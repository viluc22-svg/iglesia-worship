/**
 * PreferencesService - Servicio de Preferencias
 * 
 * Servicio que gestiona las preferencias del usuario sobre el chatbot.
 * Guarda y restaura preferencias en localStorage.
 * 
 * Requisitos: 15.1, 15.2, 15.3, 15.4
 */

import type { ChatbotPreferences } from '../types/index';

/**
 * Clave para localStorage donde se guardan las preferencias
 */
const PREFERENCES_STORAGE_KEY = 'chatbot:preferences';

/**
 * Preferencias por defecto
 */
const DEFAULT_PREFERENCES: ChatbotPreferences = {
  isMinimized: false,
  position: {
    x: 0,
    y: 0,
  },
  theme: 'light',
  lastUpdated: new Date(),
};

/**
 * Servicio para gestionar preferencias del chatbot
 */
export class PreferencesService {
  /**
   * Preferencias actuales en memoria
   */
  private preferences: ChatbotPreferences = { ...DEFAULT_PREFERENCES };

  /**
   * Constructor - Carga preferencias del localStorage
   */
  constructor() {
    this.loadPreferences();
  }

  /**
   * Carga preferencias del localStorage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated || new Date()),
        };
      } else {
        this.preferences = { ...DEFAULT_PREFERENCES };
      }
    } catch {
      // Si hay error al cargar, usar preferencias por defecto
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Guarda preferencias en localStorage
   * 
   * @param preferences - Preferencias a guardar
   */
  public savePreferences(preferences: ChatbotPreferences): void {
    try {
      this.preferences = {
        ...preferences,
        lastUpdated: new Date(),
      };

      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(this.preferences)
      );
    } catch {
      // Si hay error al guardar, mantener en memoria
      console.warn('No se pudieron guardar las preferencias en localStorage');
    }
  }

  /**
   * Obtiene las preferencias actuales
   * 
   * @returns Preferencias actuales
   */
  public getPreferences(): ChatbotPreferences {
    return { ...this.preferences };
  }

  /**
   * Actualiza una preferencia específica
   * 
   * @param key - Clave de la preferencia
   * @param value - Nuevo valor
   */
  public updatePreference<K extends keyof ChatbotPreferences>(
    key: K,
    value: ChatbotPreferences[K]
  ): void {
    this.preferences[key] = value;
    this.preferences.lastUpdated = new Date();
    this.savePreferences(this.preferences);
  }

  /**
   * Obtiene el estado minimizado
   * 
   * @returns true si está minimizado, false si está expandido
   */
  public isMinimized(): boolean {
    return this.preferences.isMinimized;
  }

  /**
   * Establece el estado minimizado
   * 
   * @param minimized - true para minimizar, false para expandir
   */
  public setMinimized(minimized: boolean): void {
    this.updatePreference('isMinimized', minimized);
  }

  /**
   * Obtiene la posición del chatbot
   * 
   * @returns Posición {x, y}
   */
  public getPosition(): { x: number; y: number } {
    return { ...this.preferences.position };
  }

  /**
   * Establece la posición del chatbot
   * 
   * @param x - Coordenada X
   * @param y - Coordenada Y
   */
  public setPosition(x: number, y: number): void {
    this.updatePreference('position', { x, y });
  }

  /**
   * Obtiene el tema actual
   * 
   * @returns Tema ('light' o 'dark')
   */
  public getTheme(): 'light' | 'dark' {
    return this.preferences.theme;
  }

  /**
   * Establece el tema
   * 
   * @param theme - Tema ('light' o 'dark')
   */
  public setTheme(theme: 'light' | 'dark'): void {
    this.updatePreference('theme', theme);
  }

  /**
   * Obtiene la fecha de última actualización
   * 
   * @returns Fecha de última actualización
   */
  public getLastUpdated(): Date {
    return new Date(this.preferences.lastUpdated);
  }

  /**
   * Limpia todas las preferencias y restaura los valores por defecto
   */
  public clearPreferences(): void {
    try {
      localStorage.removeItem(PREFERENCES_STORAGE_KEY);
      this.preferences = { ...DEFAULT_PREFERENCES };
    } catch {
      console.warn('No se pudieron limpiar las preferencias');
    }
  }

  /**
   * Restaura las preferencias por defecto
   */
  public resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences(this.preferences);
  }

  /**
   * Exporta las preferencias como JSON
   * 
   * @returns String JSON de las preferencias
   */
  public exportAsJSON(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Importa preferencias desde JSON
   * 
   * @param json - String JSON de las preferencias
   * @returns true si se importó correctamente, false si hay error
   */
  public importFromJSON(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      this.preferences = {
        ...DEFAULT_PREFERENCES,
        ...imported,
        lastUpdated: new Date(imported.lastUpdated || new Date()),
      };
      this.savePreferences(this.preferences);
      return true;
    } catch {
      return false;
    }
  }
}

export default PreferencesService;
