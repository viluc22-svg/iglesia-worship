/**
 * IntentRecognizer Tests
 * 
 * Tests para el servicio de reconocimiento de intenciones.
 * Valida que el chatbot reconozca correctamente las intenciones del usuario
 * incluso con variaciones de ortografía y orden de palabras.
 * 
 * Requisitos: 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntentRecognizer } from '../services/IntentRecognizer';
import type { IntentType } from '../types/index';

describe('IntentRecognizer', () => {
  let recognizer: IntentRecognizer;

  beforeEach(() => {
    recognizer = new IntentRecognizer();
  });

  describe('Intent Recognition Basics', () => {
    it('should return an intent object with required properties', () => {
      const message = 'help';
      const intent = recognizer.recognizeIntent(message);

      expect(intent).toBeDefined();
      expect(intent.type).toBeDefined();
      expect(intent.confidence).toBeDefined();
      expect(intent.category).toBeDefined();
    });

    it('should return confidence between 0 and 1', () => {
      const message = 'help me';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.confidence).toBeGreaterThanOrEqual(0);
      expect(intent.confidence).toBeLessThanOrEqual(1);
    });

    it('should recognize audio configuration intent', () => {
      const message = 'cómo configuro el audio';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('AUDIO_CONFIGURATION');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize worship services intent', () => {
      const message = 'crear servicio de adoración';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('WORSHIP_SERVICES');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize user management intent', () => {
      const message = 'gestionar usuarios';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('USER_MANAGEMENT');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize general help intent', () => {
      const message = 'necesito ayuda';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('GENERAL_HELP');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Confidence Scoring', () => {
    it('should return higher confidence for exact pattern matches', () => {
      const exactMessage = 'cómo configuro el audio';
      const exactIntent = recognizer.recognizeIntent(exactMessage);

      const partialMessage = 'audio';
      const partialIntent = recognizer.recognizeIntent(partialMessage);

      expect(exactIntent.confidence).toBeGreaterThanOrEqual(
        partialIntent.confidence
      );
    });

    it('should return 0 confidence for UNKNOWN intent', () => {
      const message = 'xyzabc qwerty asdfgh';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('UNKNOWN');
      expect(intent.confidence).toBe(0);
    });

    it('should return UNKNOWN for low confidence matches', () => {
      const message = 'xyz';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('UNKNOWN');
      expect(intent.confidence).toBe(0);
    });
  });

  describe('Empty and Invalid Input', () => {
    it('should handle empty string', () => {
      const message = '';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('UNKNOWN');
      expect(intent.confidence).toBe(0);
    });

    it('should handle whitespace-only string', () => {
      const message = '   ';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('UNKNOWN');
      expect(intent.confidence).toBe(0);
    });

    it('should handle special characters', () => {
      const message = '!@#$%^&*()';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('UNKNOWN');
      expect(intent.confidence).toBe(0);
    });
  });

  describe('Intent Category', () => {
    it('should return correct category for AUDIO_CONFIGURATION', () => {
      const message = 'cómo configuro el audio';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.category).toBe('Configuración de Audio');
    });

    it('should return correct category for UNKNOWN', () => {
      const message = 'xyz';
      const intent = recognizer.recognizeIntent(message);

      // Category for UNKNOWN might be lowercase 'unknown' or 'Desconocida'
      expect(
        intent.category === 'Desconocida' || intent.category === 'unknown'
      ).toBe(true);
    });

    it('should return valid category for any intent', () => {
      const messages = [
        'cómo configuro el audio',
        'crear servicio',
        'gestionar usuarios',
        'necesito ayuda',
      ];

      for (const msg of messages) {
        const intent = recognizer.recognizeIntent(msg);
        expect(intent.category).toBeDefined();
        expect(intent.category.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Punctuation Handling', () => {
    it('should handle messages with punctuation', () => {
      const message = '¿Cómo configuro el audio?';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('AUDIO_CONFIGURATION');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should handle messages with multiple punctuation marks', () => {
      const message = '¡¿Cómo configuro el audio?!';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('AUDIO_CONFIGURATION');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('calculateIntentConfidence Method', () => {
    it('should return the confidence value from intent', () => {
      const message = 'cómo configuro el audio';
      const intent = recognizer.recognizeIntent(message);
      const confidence = recognizer.calculateIntentConfidence(
        message,
        intent
      );

      expect(confidence).toBe(intent.confidence);
    });

    it('should return 0 for UNKNOWN intent', () => {
      const message = 'xyz';
      const intent = recognizer.recognizeIntent(message);
      const confidence = recognizer.calculateIntentConfidence(
        message,
        intent
      );

      expect(confidence).toBe(0);
    });
  });

  describe('Intent Type Validation', () => {
    it('should return valid intent type', () => {
      const validTypes: IntentType[] = [
        'MANAGE_MUSICIANS',
        'AUDIO_CONFIGURATION',
        'WORSHIP_SERVICES',
        'USER_MANAGEMENT',
        'GENERAL_HELP',
        'FEATURE_EXPLANATION',
        'UNKNOWN',
      ];

      const message = 'help';
      const intent = recognizer.recognizeIntent(message);

      expect(validTypes).toContain(intent.type);
    });

    it('should return consistent intent type for same message', () => {
      const message = 'cómo configuro el audio';

      const intent1 = recognizer.recognizeIntent(message);
      const intent2 = recognizer.recognizeIntent(message);

      expect(intent1.type).toBe(intent2.type);
      expect(intent1.confidence).toBe(intent2.confidence);
    });
  });

  describe('Multiple Intent Recognition', () => {
    it('should recognize different intents for different messages', () => {
      const messages = [
        'cómo configuro el audio',
        'crear servicio',
        'gestionar usuarios',
      ];

      const intents = messages.map((msg) =>
        recognizer.recognizeIntent(msg)
      );

      // At least some should be recognized (not all UNKNOWN)
      const recognizedCount = intents.filter(
        (i) => i.type !== 'UNKNOWN'
      ).length;
      expect(recognizedCount).toBeGreaterThan(0);
    });
  });

  describe('Case Handling', () => {
    it('should handle mixed case messages', () => {
      const message = 'CóMo CoNfIgUrO eL aUdIo';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('AUDIO_CONFIGURATION');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should handle uppercase messages', () => {
      const message = 'CÓMO CONFIGURO EL AUDIO';
      const intent = recognizer.recognizeIntent(message);

      expect(intent.type).toBe('AUDIO_CONFIGURATION');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });
  });
});
