/**
 * PreferencesService Tests
 * 
 * Tests para el servicio de preferencias del chatbot.
 * Valida que las preferencias se guarden y recuperen correctamente
 * desde localStorage.
 * 
 * Requisitos: 15.1, 15.2, 15.3, 15.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PreferencesService } from '../services/PreferencesService';
import type { ChatbotPreferences } from '../types/index';

describe('PreferencesService', () => {
  let service: PreferencesService;

  beforeEach(() => {
    localStorage.clear();
    service = new PreferencesService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default preferences', () => {
      const prefs = service.getPreferences();

      expect(prefs.isMinimized).toBe(false);
      expect(prefs.position.x).toBe(0);
      expect(prefs.position.y).toBe(0);
      expect(prefs.theme).toBe('light');
    });

    it('should load preferences from localStorage if available', () => {
      const savedPrefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 100, y: 200 },
        theme: 'dark',
        lastUpdated: new Date(),
      };

      localStorage.setItem(
        'chatbot:preferences',
        JSON.stringify(savedPrefs)
      );

      const newService = new PreferencesService();
      const prefs = newService.getPreferences();

      expect(prefs.isMinimized).toBe(true);
      expect(prefs.position.x).toBe(100);
      expect(prefs.position.y).toBe(200);
      expect(prefs.theme).toBe('dark');
    });

    it('should use default preferences if localStorage is empty', () => {
      const prefs = service.getPreferences();

      expect(prefs.isMinimized).toBe(false);
      expect(prefs.position.x).toBe(0);
      expect(prefs.position.y).toBe(0);
      expect(prefs.theme).toBe('light');
    });

    it('should use default preferences if localStorage has invalid JSON', () => {
      localStorage.setItem('chatbot:preferences', 'invalid json');

      const newService = new PreferencesService();
      const prefs = newService.getPreferences();

      expect(prefs.isMinimized).toBe(false);
      expect(prefs.position.x).toBe(0);
      expect(prefs.position.y).toBe(0);
      expect(prefs.theme).toBe('light');
    });
  });

  describe('Save and Retrieve Minimized State', () => {
    it('should save minimized state', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 0, y: 0 },
        theme: 'light',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const retrieved = service.getPreferences();

      expect(retrieved.isMinimized).toBe(true);
    });

    it('should retrieve minimized state', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 0, y: 0 },
        theme: 'light',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const retrieved = service.getPreferences();

      expect(retrieved.isMinimized).toBe(true);
    });

    it('should save expanded state', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: false,
        position: { x: 0, y: 0 },
        theme: 'light',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const retrieved = service.getPreferences();

      expect(retrieved.isMinimized).toBe(false);
    });

    it('should toggle minimized state', () => {
      service.setMinimized(true);
      expect(service.isMinimized()).toBe(true);

      service.setMinimized(false);
      expect(service.isMinimized()).toBe(false);
    });

    it('should persist minimized state to localStorage', () => {
      service.setMinimized(true);

      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.isMinimized).toBe(true);
    });
  });

  describe('Save and Retrieve Position', () => {
    it('should save position', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: false,
        position: { x: 100, y: 200 },
        theme: 'light',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const retrieved = service.getPreferences();

      expect(retrieved.position.x).toBe(100);
      expect(retrieved.position.y).toBe(200);
    });

    it('should retrieve position', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: false,
        position: { x: 150, y: 250 },
        theme: 'light',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const position = service.getPosition();

      expect(position.x).toBe(150);
      expect(position.y).toBe(250);
    });

    it('should set position', () => {
      service.setPosition(300, 400);
      const position = service.getPosition();

      expect(position.x).toBe(300);
      expect(position.y).toBe(400);
    });

    it('should persist position to localStorage', () => {
      service.setPosition(500, 600);

      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.position.x).toBe(500);
      expect(parsed.position.y).toBe(600);
    });

    it('should handle negative coordinates', () => {
      service.setPosition(-100, -200);
      const position = service.getPosition();

      expect(position.x).toBe(-100);
      expect(position.y).toBe(-200);
    });

    it('should handle zero coordinates', () => {
      service.setPosition(0, 0);
      const position = service.getPosition();

      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    it('should handle large coordinates', () => {
      service.setPosition(10000, 20000);
      const position = service.getPosition();

      expect(position.x).toBe(10000);
      expect(position.y).toBe(20000);
    });
  });

  describe('Theme Management', () => {
    it('should get default theme', () => {
      const theme = service.getTheme();
      expect(theme).toBe('light');
    });

    it('should set theme to dark', () => {
      service.setTheme('dark');
      const theme = service.getTheme();

      expect(theme).toBe('dark');
    });

    it('should set theme to light', () => {
      service.setTheme('dark');
      service.setTheme('light');
      const theme = service.getTheme();

      expect(theme).toBe('light');
    });

    it('should persist theme to localStorage', () => {
      service.setTheme('dark');

      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.theme).toBe('dark');
    });
  });

  describe('Clear Preferences', () => {
    it('should clear preferences', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 100, y: 200 },
        theme: 'dark',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      service.clearPreferences();

      const retrieved = service.getPreferences();
      expect(retrieved.isMinimized).toBe(false);
      expect(retrieved.position.x).toBe(0);
      expect(retrieved.position.y).toBe(0);
      expect(retrieved.theme).toBe('light');
    });

    it('should remove preferences from localStorage', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 100, y: 200 },
        theme: 'dark',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      service.clearPreferences();

      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeNull();
    });

    it('should reset to defaults', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 100, y: 200 },
        theme: 'dark',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      service.resetToDefaults();

      const retrieved = service.getPreferences();
      expect(retrieved.isMinimized).toBe(false);
      expect(retrieved.position.x).toBe(0);
      expect(retrieved.position.y).toBe(0);
      expect(retrieved.theme).toBe('light');
    });
  });

  describe('Handle Missing Preferences', () => {
    it('should handle missing preferences gracefully', () => {
      const prefs = service.getPreferences();

      expect(prefs).toBeDefined();
      expect(prefs.isMinimized).toBe(false);
      expect(prefs.position).toBeDefined();
      expect(prefs.theme).toBe('light');
    });

    it('should provide default values for missing fields', () => {
      const partialPrefs = {
        isMinimized: true,
      };

      localStorage.setItem('chatbot:preferences', JSON.stringify(partialPrefs));

      const newService = new PreferencesService();
      const prefs = newService.getPreferences();

      expect(prefs.isMinimized).toBe(true);
      expect(prefs.position).toBeDefined();
      expect(prefs.theme).toBe('light');
    });
  });

  describe('Update Preference', () => {
    it('should update individual preference', () => {
      service.updatePreference('isMinimized', true);
      expect(service.isMinimized()).toBe(true);

      service.updatePreference('isMinimized', false);
      expect(service.isMinimized()).toBe(false);
    });

    it('should update position preference', () => {
      service.updatePreference('position', { x: 100, y: 200 });
      const position = service.getPosition();

      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    it('should update theme preference', () => {
      service.updatePreference('theme', 'dark');
      expect(service.getTheme()).toBe('dark');
    });

    it('should update lastUpdated when saving', () => {
      const before = new Date();
      service.updatePreference('isMinimized', true);
      const after = new Date();

      const prefs = service.getPreferences();
      expect(prefs.lastUpdated.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(prefs.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Last Updated Tracking', () => {
    it('should track last updated date', () => {
      const before = new Date();
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 100, y: 200 },
        theme: 'dark',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const after = new Date();

      const lastUpdated = service.getLastUpdated();
      expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should update lastUpdated when preferences change', async () => {
      service.setMinimized(true);
      const firstUpdate = service.getLastUpdated();

      // Wait a bit to ensure time difference
      const delay = new Promise((resolve) => setTimeout(resolve, 10));
      await delay;

      service.setMinimized(false);
      const secondUpdate = service.getLastUpdated();

      expect(secondUpdate.getTime()).toBeGreaterThanOrEqual(
        firstUpdate.getTime()
      );
    });
  });

  describe('Export and Import', () => {
    it('should export preferences as JSON', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 100, y: 200 },
        theme: 'dark',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const json = service.exportAsJSON();

      expect(typeof json).toBe('string');
      expect(json).toContain('isMinimized');
      expect(json).toContain('position');
      expect(json).toContain('theme');
    });

    it('should import preferences from JSON', () => {
      const prefs: ChatbotPreferences = {
        isMinimized: true,
        position: { x: 100, y: 200 },
        theme: 'dark',
        lastUpdated: new Date(),
      };

      service.savePreferences(prefs);
      const json = service.exportAsJSON();

      const newService = new PreferencesService();
      const success = newService.importFromJSON(json);

      expect(success).toBe(true);
      const imported = newService.getPreferences();
      expect(imported.isMinimized).toBe(true);
      expect(imported.position.x).toBe(100);
      expect(imported.position.y).toBe(200);
      expect(imported.theme).toBe('dark');
    });

    it('should handle invalid JSON on import', () => {
      const success = service.importFromJSON('invalid json');
      expect(success).toBe(false);
    });

    it('should handle empty JSON on import', () => {
      const success = service.importFromJSON('{}');
      expect(success).toBe(true);

      const prefs = service.getPreferences();
      expect(prefs.isMinimized).toBe(false);
      expect(prefs.theme).toBe('light');
    });
  });

  describe('Preference Persistence Round Trip', () => {
    it('should persist and retrieve minimized state', () => {
      service.setMinimized(true);

      const newService = new PreferencesService();
      expect(newService.isMinimized()).toBe(true);
    });

    it('should persist and retrieve position', () => {
      service.setPosition(123, 456);

      const newService = new PreferencesService();
      const position = newService.getPosition();

      expect(position.x).toBe(123);
      expect(position.y).toBe(456);
    });

    it('should persist and retrieve theme', () => {
      service.setTheme('dark');

      const newService = new PreferencesService();
      expect(newService.getTheme()).toBe('dark');
    });

    it('should persist all preferences together', () => {
      service.setMinimized(true);
      service.setPosition(100, 200);
      service.setTheme('dark');

      const newService = new PreferencesService();
      const prefs = newService.getPreferences();

      expect(prefs.isMinimized).toBe(true);
      expect(prefs.position.x).toBe(100);
      expect(prefs.position.y).toBe(200);
      expect(prefs.theme).toBe('dark');
    });
  });

  describe('Preference Isolation', () => {
    it('should return copy of preferences, not reference', () => {
      const prefs1 = service.getPreferences();
      const prefs2 = service.getPreferences();

      expect(prefs1).not.toBe(prefs2);
      expect(prefs1).toEqual(prefs2);
    });

    it('should return copy of position, not reference', () => {
      service.setPosition(100, 200);

      const pos1 = service.getPosition();
      const pos2 = service.getPosition();

      expect(pos1).not.toBe(pos2);
      expect(pos1).toEqual(pos2);
    });
  });
});
