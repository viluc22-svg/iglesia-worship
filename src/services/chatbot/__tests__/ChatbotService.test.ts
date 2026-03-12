/**
 * ChatbotService Tests
 * 
 * Tests para el servicio orquestador principal del chatbot.
 * Valida que el servicio procese mensajes correctamente,
 * genere sugerencias contextuales y maneje la conversación.
 * 
 * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChatbotService } from '../services/ChatbotService';

describe('ChatbotService', () => {
  let service: ChatbotService;

  beforeEach(() => {
    localStorage.clear();
    service = new ChatbotService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Message Processing', () => {
    it('should process complete message', async () => {
      const message = 'agregar músico';
      const response = await service.processMessage(message);

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.intent).toBeDefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should recognize intent from message', async () => {
      const message = 'cómo configuro el audio';
      const response = await service.processMessage(message);

      expect(response.intent.type).toBe('AUDIO_CONFIGURATION');
      expect(response.intent.confidence).toBeGreaterThan(0.5);
    });

    it('should extract entities from message', async () => {
      const message = 'agregar a Juan';
      const response = await service.processMessage(message);

      expect(response.entities).toBeDefined();
      expect(Array.isArray(response.entities)).toBe(true);
    });

    it('should add message to history', async () => {
      const message = 'agregar músico';
      await service.processMessage(message);

      const history = service.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should handle empty message', async () => {
      const message = '';
      const response = await service.processMessage(message);

      expect(response.message).toBeDefined();
      expect(response.isKnown).toBe(false);
    });

    it('should handle whitespace-only message', async () => {
      const message = '   ';
      const response = await service.processMessage(message);

      expect(response.message).toBeDefined();
      expect(response.isKnown).toBe(false);
    });

    it('should handle unknown message', async () => {
      const message = 'xyz qwerty asdfgh';
      const response = await service.processMessage(message);

      expect(response.intent.type).toBe('UNKNOWN');
      expect(response.isKnown).toBe(false);
    });

    it('should return response with ID', async () => {
      const message = 'agregar músico';
      const response = await service.processMessage(message);

      expect(response.id).toBeDefined();
      expect(response.id.length).toBeGreaterThan(0);
    });

    it('should return response with timestamp', async () => {
      const message = 'agregar músico';
      const response = await service.processMessage(message);

      expect(response.timestamp).toBeDefined();
      expect(response.timestamp instanceof Date).toBe(true);
    });
  });

  describe('Contextual Suggestions', () => {
    it('should generate contextual suggestions', () => {
      const suggestions = service.getContextualSuggestions(
        'musicians-page',
        'user'
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should generate suggestions for musicians page', () => {
      const suggestions = service.getContextualSuggestions(
        'musicians-page',
        'user'
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should generate suggestions for audio settings page', () => {
      const suggestions = service.getContextualSuggestions(
        'audio-settings',
        'user'
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should generate suggestions for worship services page', () => {
      const suggestions = service.getContextualSuggestions(
        'worship-services',
        'user'
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should generate suggestions for admin user', () => {
      const suggestions = service.getContextualSuggestions('admin-panel', 'admin');

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should generate suggestions for regular user', () => {
      const suggestions = service.getContextualSuggestions('home', 'user');

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should limit suggestions to 4', () => {
      const suggestions = service.getContextualSuggestions(
        'musicians-page',
        'user'
      );

      expect(suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should include suggestion text and question', () => {
      const suggestions = service.getContextualSuggestions(
        'musicians-page',
        'user'
      );

      for (const suggestion of suggestions) {
        expect(suggestion.text).toBeDefined();
        expect(suggestion.question).toBeDefined();
        expect(suggestion.id).toBeDefined();
      }
    });
  });

  describe('Initial Suggestions', () => {
    it('should generate initial suggestions', () => {
      const suggestions = service.getInitialSuggestions('user');

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should generate initial suggestions for admin', () => {
      const suggestions = service.getInitialSuggestions('admin');

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should generate initial suggestions for user', () => {
      const suggestions = service.getInitialSuggestions('user');

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should include suggestion metadata', () => {
      const suggestions = service.getInitialSuggestions('user');

      for (const suggestion of suggestions) {
        expect(suggestion.text).toBeDefined();
        expect(suggestion.question).toBeDefined();
        expect(suggestion.id).toBeDefined();
      }
    });
  });

  describe('Conversation Management', () => {
    it('should clear conversation', async () => {
      const message = 'agregar músico';
      await service.processMessage(message);

      expect(service.getHistory().length).toBeGreaterThan(0);

      service.clearConversation();
      expect(service.getHistory().length).toBe(0);
    });

    it('should maintain conversation history', async () => {
      const message1 = 'agregar músico';
      const message2 = 'cómo configuro el audio';

      await service.processMessage(message1);
      await service.processMessage(message2);

      const history = service.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should get history', async () => {
      const message = 'agregar músico';
      await service.processMessage(message);

      const history = service.getHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should get last N messages', async () => {
      const messages = [
        'agregar músico',
        'cómo configuro el audio',
        'crear servicio',
      ];

      for (const msg of messages) {
        await service.processMessage(msg);
      }

      const lastTwo = service.getLastMessages(2);
      expect(lastTwo.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Context Management', () => {
    it('should update page context', () => {
      service.updatePageContext('musicians-page');
      const context = service.getContext();

      expect(context.currentPage).toBe('musicians-page');
    });

    it('should set user role', () => {
      service.setUserRole('admin');
      const context = service.getContext();

      expect(context.userRole).toBe('admin');
    });

    it('should get context', () => {
      const context = service.getContext();

      expect(context).toBeDefined();
      expect(context.currentPage).toBeDefined();
      expect(context.userRole).toBeDefined();
      expect(context.history).toBeDefined();
    });

    it('should maintain context across messages', async () => {
      service.updatePageContext('musicians-page');
      service.setUserRole('admin');

      await service.processMessage('agregar músico');

      const context = service.getContext();
      expect(context.currentPage).toBe('musicians-page');
      expect(context.userRole).toBe('admin');
    });
  });

  describe('Analytics Integration', () => {
    it('should log questions', async () => {
      const message = 'agregar músico';
      await service.processMessage(message);

      const stats = service.getStatistics();
      expect(stats.totalQuestions).toBeGreaterThan(0);
    });

    it('should track unanswered questions', async () => {
      const message = 'xyz qwerty asdfgh';
      await service.processMessage(message);

      const stats = service.getStatistics();
      expect(stats.unknownQuestions).toBeGreaterThan(0);
    });

    it('should log response usefulness', async () => {
      const message = 'agregar músico';
      const response = await service.processMessage(message);

      service.logResponseUseful(response.id, true);

      const stats = service.getStatistics();
      expect(stats.usefulResponses).toBeGreaterThan(0);
    });

    it('should get statistics', () => {
      const stats = service.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalQuestions).toBeGreaterThanOrEqual(0);
      expect(stats.totalResponses).toBeGreaterThanOrEqual(0);
      expect(stats.unknownQuestions).toBeGreaterThanOrEqual(0);
    });

    it('should get analytics service', () => {
      const analyticsService = service.getAnalyticsService();

      expect(analyticsService).toBeDefined();
    });
  });

  describe('Service Accessors', () => {
    it('should get context manager', () => {
      const contextManager = service.getContextManager();

      expect(contextManager).toBeDefined();
    });

    it('should get conversation manager', () => {
      const conversationManager = service.getConversationManager();

      expect(conversationManager).toBeDefined();
    });

    it('should get analytics service', () => {
      const analyticsService = service.getAnalyticsService();

      expect(analyticsService).toBeDefined();
    });
  });

  describe('Multiple Message Processing', () => {
    it('should process multiple messages sequentially', async () => {
      const messages = [
        'agregar músico',
        'cómo configuro el audio',
        'crear servicio',
      ];

      for (const msg of messages) {
        const response = await service.processMessage(msg);
        expect(response).toBeDefined();
        expect(response.message).toBeDefined();
      }

      const history = service.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(messages.length);
    });

    it('should maintain context across multiple messages', async () => {
      service.updatePageContext('musicians-page');

      await service.processMessage('agregar músico');
      await service.processMessage('cómo editar');

      const context = service.getContext();
      expect(context.currentPage).toBe('musicians-page');
    });

    it('should track intent progression', async () => {
      await service.processMessage('cómo configuro el audio');
      await service.processMessage('cómo configuro el audio');

      const history = service.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const firstIntent = history[0].intent;
      const secondIntent = history[1].intent;

      // Both should have intents recognized
      expect(firstIntent).toBeDefined();
      expect(secondIntent).toBeDefined();
      
      // Both should be the same intent
      expect(firstIntent?.type).toBe(secondIntent?.type);
      expect(firstIntent?.type).toBe('AUDIO_CONFIGURATION');
    });
  });

  describe('Response Suggestions', () => {
    it('should include suggestions in response', async () => {
      const message = 'agregar músico';
      const response = await service.processMessage(message);

      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
    });

    it('should limit response suggestions to 4', async () => {
      const message = 'agregar músico';
      const response = await service.processMessage(message);

      expect(response.suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should include suggestion metadata in response', async () => {
      const message = 'agregar músico';
      const response = await service.processMessage(message);

      for (const suggestion of response.suggestions) {
        expect(suggestion.text).toBeDefined();
        expect(suggestion.question).toBeDefined();
        expect(suggestion.id).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle null message gracefully', async () => {
      const response = await service.processMessage('');

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should handle very long message', async () => {
      const longMessage = 'a'.repeat(1000);
      const response = await service.processMessage(longMessage);

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should handle special characters', async () => {
      const message = '!@#$%^&*()';
      const response = await service.processMessage(message);

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const message = '你好世界 مرحبا العالم';
      const response = await service.processMessage(message);

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });
  });

  describe('Async Processing', () => {
    it('should return promise from processMessage', () => {
      const result = service.processMessage('agregar músico');

      expect(result instanceof Promise).toBe(true);
    });

    it('should resolve promise with response', async () => {
      const response = await service.processMessage('agregar músico');

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should handle concurrent message processing', async () => {
      const messages = [
        'agregar músico',
        'cómo configuro el audio',
        'crear servicio',
      ];

      const promises = messages.map((msg) => service.processMessage(msg));
      const responses = await Promise.all(promises);

      expect(responses.length).toBe(3);
      for (const response of responses) {
        expect(response).toBeDefined();
        expect(response.message).toBeDefined();
      }
    });
  });
});
