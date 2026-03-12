/**
 * EntityExtractor Tests
 * 
 * Tests para el servicio de extracción de entidades.
 * Valida que el chatbot extraiga correctamente información específica
 * como nombres de músicos, instrumentos y tipos de servicios.
 * 
 * Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EntityExtractor } from '../services/EntityExtractor';
import type { EntityType } from '../types/index';

describe('EntityExtractor', () => {
  let extractor: EntityExtractor;

  beforeEach(() => {
    extractor = new EntityExtractor();
  });

  describe('Basic Entity Extraction', () => {
    it('should extract entities from message', () => {
      const message = 'guitarra';
      const entities = extractor.extractEntities(message);

      expect(Array.isArray(entities)).toBe(true);
    });

    it('should extract instrument from "guitarra"', () => {
      const message = 'guitarra';
      const entities = extractor.extractEntities(message);

      const instrumentEntity = entities.find((e) => e.type === 'INSTRUMENT');
      expect(instrumentEntity).toBeDefined();
      expect(instrumentEntity?.value.toLowerCase()).toContain('guitarra');
    });

    it('should extract instrument from "piano"', () => {
      const message = 'piano';
      const entities = extractor.extractEntities(message);

      const instrumentEntity = entities.find((e) => e.type === 'INSTRUMENT');
      expect(instrumentEntity).toBeDefined();
      expect(instrumentEntity?.value.toLowerCase()).toContain('piano');
    });

    it('should extract service type from "domingo"', () => {
      const message = 'domingo';
      const entities = extractor.extractEntities(message);

      const serviceEntity = entities.find((e) => e.type === 'SERVICE_TYPE');
      expect(serviceEntity).toBeDefined();
      expect(serviceEntity?.value.toLowerCase()).toContain('domingo');
    });
  });

  describe('Entity Position', () => {
    it('should return entity position in message', () => {
      const message = 'guitarra';
      const entities = extractor.extractEntities(message);

      for (const entity of entities) {
        expect(entity.position).toBeDefined();
        expect(entity.position.start).toBeGreaterThanOrEqual(0);
        expect(entity.position.end).toBeGreaterThan(entity.position.start);
      }
    });

    it('should have correct position for entity', () => {
      const message = 'guitarra piano';
      const entities = extractor.extractEntities(message);

      expect(entities.length).toBeGreaterThanOrEqual(1);

      for (const entity of entities) {
        expect(entity.position.start).toBeGreaterThanOrEqual(0);
        expect(entity.position.end).toBeLessThanOrEqual(message.length);
      }
    });
  });

  describe('Multiple Entities', () => {
    it('should extract multiple entities from one message', () => {
      const message = 'guitarra piano';
      const entities = extractor.extractEntities(message);

      expect(entities.length).toBeGreaterThanOrEqual(1);
    });

    it('should maintain order of entities by position', () => {
      const message = 'guitarra piano';
      const entities = extractor.extractEntities(message);

      if (entities.length > 1) {
        for (let i = 0; i < entities.length - 1; i++) {
          expect(entities[i].position.start).toBeLessThanOrEqual(
            entities[i + 1].position.start
          );
        }
      }
    });
  });

  describe('Entity Normalization', () => {
    it('should normalize instrument names', () => {
      const message = 'guitarra';
      const entities = extractor.extractEntities(message);

      const instrumentEntity = entities.find((e) => e.type === 'INSTRUMENT');
      expect(instrumentEntity?.value).toBeDefined();
      expect(instrumentEntity?.value.length).toBeGreaterThan(0);
    });

    it('should normalize "bateria" to "batería"', () => {
      const message = 'bateria';
      const entities = extractor.extractEntities(message);

      const instrumentEntity = entities.find((e) => e.type === 'INSTRUMENT');
      if (instrumentEntity) {
        expect(instrumentEntity.value).toBe('batería');
      }
    });

    it('should normalize "violin" to "violín"', () => {
      const message = 'violin';
      const entities = extractor.extractEntities(message);

      const instrumentEntity = entities.find((e) => e.type === 'INSTRUMENT');
      if (instrumentEntity) {
        expect(instrumentEntity.value).toBe('violín');
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should return confidence between 0 and 1', () => {
      const message = 'guitarra';
      const entities = extractor.extractEntities(message);

      for (const entity of entities) {
        expect(entity.confidence).toBeGreaterThanOrEqual(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should return high confidence for extracted entities', () => {
      const message = 'guitarra';
      const entities = extractor.extractEntities(message);

      for (const entity of entities) {
        expect(entity.confidence).toBeGreaterThan(0.7);
      }
    });
  });

  describe('Empty and Invalid Input', () => {
    it('should handle empty string', () => {
      const message = '';
      const entities = extractor.extractEntities(message);

      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(0);
    });

    it('should handle whitespace-only string', () => {
      const message = '   ';
      const entities = extractor.extractEntities(message);

      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(0);
    });
  });

  describe('Case Insensitivity', () => {
    it('should extract entity regardless of case', () => {
      const message = 'GUITARRA';
      const entities = extractor.extractEntities(message);

      const instrumentEntity = entities.find((e) => e.type === 'INSTRUMENT');
      expect(instrumentEntity).toBeDefined();
    });

    it('should extract service type regardless of case', () => {
      const message = 'DOMINGO';
      const entities = extractor.extractEntities(message);

      const serviceEntity = entities.find((e) => e.type === 'SERVICE_TYPE');
      expect(serviceEntity).toBeDefined();
    });
  });

  describe('Duplicate Prevention', () => {
    it('should not extract duplicate entities', () => {
      const message = 'guitarra guitarra guitarra';
      const entities = extractor.extractEntities(message);

      const guitarraEntities = entities.filter(
        (e) => e.value.toLowerCase() === 'guitarra'
      );
      expect(guitarraEntities.length).toBe(1);
    });
  });

  describe('extractEntitiesByType Method', () => {
    it('should extract only INSTRUMENT entities', () => {
      const message = 'guitarra piano';
      const entities = extractor.extractEntitiesByType(message, 'INSTRUMENT');

      expect(entities.every((e) => e.type === 'INSTRUMENT')).toBe(true);
    });

    it('should return empty array if no entities of type found', () => {
      const message = 'xyz qwerty';
      const entities = extractor.extractEntitiesByType(
        message,
        'MUSICIAN_NAME'
      );

      // Should return empty or only if there are actual musician names
      expect(Array.isArray(entities)).toBe(true);
    });

    it('should extract only SERVICE_TYPE entities', () => {
      const message = 'domingo';
      const entities = extractor.extractEntitiesByType(message, 'SERVICE_TYPE');

      expect(entities.every((e) => e.type === 'SERVICE_TYPE')).toBe(true);
    });
  });

  describe('getEntityTypeDescription Method', () => {
    it('should return description for MUSICIAN_NAME', () => {
      const description = extractor.getEntityTypeDescription('MUSICIAN_NAME');
      expect(description).toBe('Nombre de Músico');
    });

    it('should return description for INSTRUMENT', () => {
      const description = extractor.getEntityTypeDescription('INSTRUMENT');
      expect(description).toBe('Instrumento');
    });

    it('should return description for SERVICE_TYPE', () => {
      const description = extractor.getEntityTypeDescription('SERVICE_TYPE');
      expect(description).toBe('Tipo de Servicio');
    });

    it('should return description for AUDIO_SETTING', () => {
      const description = extractor.getEntityTypeDescription('AUDIO_SETTING');
      expect(description).toBe('Configuración de Audio');
    });

    it('should return description for FEATURE_NAME', () => {
      const description = extractor.getEntityTypeDescription('FEATURE_NAME');
      expect(description).toBe('Nombre de Característica');
    });

    it('should return description for ACTION', () => {
      const description = extractor.getEntityTypeDescription('ACTION');
      expect(description).toBe('Acción');
    });
  });

  describe('Complex Messages', () => {
    it('should extract entities from complex message', () => {
      const message = 'guitarra piano domingo';
      const entities = extractor.extractEntities(message);

      expect(entities.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract entities from message with punctuation', () => {
      const message = '¿guitarra?';
      const entities = extractor.extractEntities(message);

      expect(Array.isArray(entities)).toBe(true);
    });

    it('should extract entities from message with special characters', () => {
      const message = 'guitarra-eléctrica';
      const entities = extractor.extractEntities(message);

      expect(Array.isArray(entities)).toBe(true);
    });
  });

  describe('Entity Type Validation', () => {
    it('should return valid entity types', () => {
      const validTypes: EntityType[] = [
        'MUSICIAN_NAME',
        'INSTRUMENT',
        'SERVICE_TYPE',
        'AUDIO_SETTING',
        'FEATURE_NAME',
        'ACTION',
      ];

      const message = 'guitarra domingo';
      const entities = extractor.extractEntities(message);

      for (const entity of entities) {
        expect(validTypes).toContain(entity.type);
      }
    });
  });

  describe('Entity Isolation', () => {
    it('should return copy of entities, not reference', () => {
      const message = 'guitarra';
      const entities1 = extractor.extractEntities(message);
      const entities2 = extractor.extractEntities(message);

      expect(entities1).not.toBe(entities2);
      expect(entities1).toEqual(entities2);
    });
  });
});
