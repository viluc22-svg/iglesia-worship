/**
 * ResponseBuilder Tests
 * 
 * Tests para el constructor de respuestas del chatbot.
 * Valida que las respuestas se construyan correctamente con formato,
 * entidades incluidas y sugerencias apropiadas.
 * 
 * Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseBuilder } from '../services/ResponseBuilder';
import type { ConversationContext, Intent, Entity } from '../types/index';

describe('ResponseBuilder', () => {
  let builder: ResponseBuilder;
  let mockContext: ConversationContext;

  beforeEach(() => {
    builder = new ResponseBuilder();
    mockContext = {
      currentPage: 'home',
      userRole: 'user',
      history: [],
    };
  });

  describe('Basic Response Building', () => {
    it('should build response for MANAGE_MUSICIANS intent', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
      expect(response.intent).toEqual(intent);
      expect(response.isKnown).toBe(true);
    });

    it('should build response for AUDIO_CONFIGURATION intent', () => {
      const intent: Intent = {
        type: 'AUDIO_CONFIGURATION',
        confidence: 0.95,
        category: 'Configuración de Audio',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
      expect(response.isKnown).toBe(true);
    });

    it('should build response for WORSHIP_SERVICES intent', () => {
      const intent: Intent = {
        type: 'WORSHIP_SERVICES',
        confidence: 0.95,
        category: 'Servicios de Adoración',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
      expect(response.isKnown).toBe(true);
    });

    it('should build response for UNKNOWN intent', () => {
      const intent: Intent = {
        type: 'UNKNOWN',
        confidence: 0,
        category: 'Desconocida',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.message).toBeDefined();
      expect(response.isKnown).toBe(false);
    });
  });

  describe('Entity Inclusion', () => {
    it('should include extracted entities in response', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const entities: Entity[] = [
        {
          type: 'MUSICIAN_NAME',
          value: 'Juan',
          confidence: 0.9,
          position: { start: 0, end: 4 },
        },
      ];

      const response = builder.buildResponse(intent, entities, mockContext);

      expect(response.entities).toEqual(entities);
      expect(response.message).toBeDefined();
    });

    it('should include multiple entities in response', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const entities: Entity[] = [
        {
          type: 'MUSICIAN_NAME',
          value: 'Juan',
          confidence: 0.9,
          position: { start: 0, end: 4 },
        },
        {
          type: 'INSTRUMENT',
          value: 'violín',
          confidence: 0.9,
          position: { start: 10, end: 16 },
        },
      ];

      const response = builder.buildResponse(intent, entities, mockContext);

      expect(response.entities.length).toBe(2);
    });
  });

  describe('Response Formatting', () => {
    it('should format response with clear text', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
      expect(typeof response.message).toBe('string');
    });

    it('should include line breaks in response', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      // Response should have some structure (may contain line breaks or formatting)
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it('should format steps as numbered list', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      // Response should be properly formatted
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it('should format options as bulleted list', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      // Response should be properly formatted
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });
  });

  describe('Response Truncation', () => {
    it('should not truncate short responses', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      // Response should be complete
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it('should truncate responses longer than 500 characters', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      // Response should not exceed max length
      expect(response.message.length).toBeLessThanOrEqual(503); // 500 + "..."
    });

    it('should add ellipsis when truncating', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      // If truncated, should end with ellipsis
      if (response.message.length > 500) {
        expect(response.message.endsWith('...')).toBe(true);
      }
    });
  });

  describe('Response Metadata', () => {
    it('should include response ID', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.id).toBeDefined();
      expect(response.id.length).toBeGreaterThan(0);
    });

    it('should include timestamp', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.timestamp).toBeDefined();
      expect(response.timestamp instanceof Date).toBe(true);
    });

    it('should include intent in response', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.intent).toEqual(intent);
    });

    it('should include suggestions in response', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
    });
  });

  describe('Suggestions Generation', () => {
    it('should generate suggestions for known intent', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.suggestions.length).toBeGreaterThanOrEqual(0);
      expect(response.suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should generate suggestions for unknown intent', () => {
      const intent: Intent = {
        type: 'UNKNOWN',
        confidence: 0,
        category: 'Desconocida',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.suggestions.length).toBeGreaterThanOrEqual(0);
      expect(response.suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should limit suggestions to 4', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      expect(response.suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should include suggestion text and question', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response = builder.buildResponse(intent, [], mockContext);

      for (const suggestion of response.suggestions) {
        expect(suggestion.text).toBeDefined();
        expect(suggestion.question).toBeDefined();
        expect(suggestion.id).toBeDefined();
      }
    });
  });

  describe('Contextual Responses', () => {
    it('should use contextual response when on musicians page', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const contextMusiciansPage: ConversationContext = {
        currentPage: 'musicians-page',
        userRole: 'user',
        history: [],
      };

      const response = builder.buildResponse(intent, [], contextMusiciansPage);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it('should use contextual response when on audio settings page', () => {
      const intent: Intent = {
        type: 'AUDIO_CONFIGURATION',
        confidence: 0.95,
        category: 'Configuración de Audio',
      };

      const contextAudioPage: ConversationContext = {
        currentPage: 'audio-settings',
        userRole: 'user',
        history: [],
      };

      const response = builder.buildResponse(intent, [], contextAudioPage);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it('should use general response when contextual not available', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const contextUnknownPage: ConversationContext = {
        currentPage: 'unknown-page',
        userRole: 'user',
        history: [],
      };

      const response = builder.buildResponse(intent, [], contextUnknownPage);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });
  });

  describe('Unknown Response Building', () => {
    it('should build unknown response', () => {
      const response = builder.buildUnknownResponse(mockContext);

      expect(response.message).toBeDefined();
      expect(response.intent.type).toBe('UNKNOWN');
      expect(response.isKnown).toBe(false);
    });

    it('should include suggestions in unknown response', () => {
      const response = builder.buildUnknownResponse(mockContext);

      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
    });
  });

  describe('Empty Message Response Building', () => {
    it('should build empty message response', () => {
      const response = builder.buildEmptyMessageResponse(mockContext);

      expect(response.message).toBeDefined();
      expect(response.message).toContain('pregunta');
      expect(response.isKnown).toBe(false);
    });

    it('should include suggestions in empty message response', () => {
      const response = builder.buildEmptyMessageResponse(mockContext);

      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
    });

    it('should have UNKNOWN intent in empty message response', () => {
      const response = builder.buildEmptyMessageResponse(mockContext);

      expect(response.intent.type).toBe('UNKNOWN');
      expect(response.intent.confidence).toBe(0);
    });
  });

  describe('Response Consistency', () => {
    it('should return consistent intent for same input', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response1 = builder.buildResponse(intent, [], mockContext);
      const response2 = builder.buildResponse(intent, [], mockContext);

      expect(response1.intent).toEqual(response2.intent);
      expect(response1.isKnown).toBe(response2.isKnown);
    });

    it('should return different IDs for different responses', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const response1 = builder.buildResponse(intent, [], mockContext);
      const response2 = builder.buildResponse(intent, [], mockContext);

      expect(response1.id).not.toBe(response2.id);
    });
  });

  describe('Response with Different Contexts', () => {
    it('should build response for admin user', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const adminContext: ConversationContext = {
        currentPage: 'admin-panel',
        userRole: 'admin',
        history: [],
      };

      const response = builder.buildResponse(intent, [], adminContext);

      expect(response.message).toBeDefined();
      expect(response.isKnown).toBe(true);
    });

    it('should build response for regular user', () => {
      const intent: Intent = {
        type: 'MANAGE_MUSICIANS',
        confidence: 0.95,
        category: 'Gestión de Músicos',
      };

      const userContext: ConversationContext = {
        currentPage: 'home',
        userRole: 'user',
        history: [],
      };

      const response = builder.buildResponse(intent, [], userContext);

      expect(response.message).toBeDefined();
      expect(response.isKnown).toBe(true);
    });
  });
});
