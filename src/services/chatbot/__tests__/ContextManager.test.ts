/**
 * ContextManager Tests
 * 
 * Tests para el gestor de contexto de conversación.
 * Valida que el contexto se mantenga correctamente durante la sesión,
 * incluyendo página actual, rol del usuario e historial de mensajes.
 * 
 * Requisitos: 8.1, 8.3, 8.4, 8.5, 8.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContextManager } from '../services/ContextManager';
import type { Message } from '../types/index';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
    contextManager = new ContextManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Page Context Management', () => {
    it('should initialize with default page context', () => {
      const context = contextManager.getConversationContext();
      expect(context.currentPage).toBe('home');
    });

    it('should update page context', () => {
      contextManager.updatePageContext('musicians-page');
      const context = contextManager.getConversationContext();

      expect(context.currentPage).toBe('musicians-page');
    });

    it('should update page context multiple times', () => {
      contextManager.updatePageContext('musicians-page');
      let context = contextManager.getConversationContext();
      expect(context.currentPage).toBe('musicians-page');

      contextManager.updatePageContext('audio-settings');
      context = contextManager.getConversationContext();
      expect(context.currentPage).toBe('audio-settings');

      contextManager.updatePageContext('worship-services');
      context = contextManager.getConversationContext();
      expect(context.currentPage).toBe('worship-services');
    });

    it('should get current page', () => {
      contextManager.updatePageContext('admin-panel');
      const currentPage = contextManager.getCurrentPage();

      expect(currentPage).toBe('admin-panel');
    });
  });

  describe('User Role Management', () => {
    it('should initialize with default user role', () => {
      const context = contextManager.getConversationContext();
      expect(context.userRole).toBe('user');
    });

    it('should set user role to admin', () => {
      contextManager.setUserRole('admin');
      const context = contextManager.getConversationContext();

      expect(context.userRole).toBe('admin');
    });

    it('should set user role to user', () => {
      contextManager.setUserRole('admin');
      contextManager.setUserRole('user');
      const context = contextManager.getConversationContext();

      expect(context.userRole).toBe('user');
    });

    it('should get user role', () => {
      contextManager.setUserRole('admin');
      const userRole = contextManager.getUserRole();

      expect(userRole).toBe('admin');
    });

    it('should detect user role from localStorage', () => {
      const user = {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };
      localStorage.setItem('worship_user', JSON.stringify(user));

      const newContextManager = new ContextManager();
      const context = newContextManager.getConversationContext();

      expect(context.userRole).toBe('admin');
    });

    it('should handle invalid role in localStorage', () => {
      const user = {
        email: 'user@example.com',
        name: 'User',
        role: 'invalid_role',
      };
      localStorage.setItem('worship_user', JSON.stringify(user));

      const newContextManager = new ContextManager();
      const context = newContextManager.getConversationContext();

      expect(context.userRole).toBe('user'); // Default role
    });

    it('should update user role from storage', () => {
      contextManager.setUserRole('user');

      const user = {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };
      localStorage.setItem('worship_user', JSON.stringify(user));

      contextManager.updateUserRoleFromStorage();
      const context = contextManager.getConversationContext();

      expect(context.userRole).toBe('admin');
    });
  });

  describe('Message History Management', () => {
    it('should initialize with empty history', () => {
      const context = contextManager.getConversationContext();
      expect(context.history).toEqual([]);
    });

    it('should add message to history', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      const context = contextManager.getConversationContext();

      expect(context.history.length).toBe(1);
      expect(context.history[0]).toEqual(message);
    });

    it('should add multiple messages to history', () => {
      const message1: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      const message2: Message = {
        id: 'msg-2',
        type: 'bot',
        content: 'Hi there',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message1);
      contextManager.addMessageToHistory(message2);
      const context = contextManager.getConversationContext();

      expect(context.history.length).toBe(2);
      expect(context.history[0]).toEqual(message1);
      expect(context.history[1]).toEqual(message2);
    });

    it('should preserve chronological order of history', () => {
      const now = new Date();
      const message1: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'First',
        timestamp: new Date(now.getTime()),
      };

      const message2: Message = {
        id: 'msg-2',
        type: 'bot',
        content: 'Second',
        timestamp: new Date(now.getTime() + 1000),
      };

      const message3: Message = {
        id: 'msg-3',
        type: 'user',
        content: 'Third',
        timestamp: new Date(now.getTime() + 2000),
      };

      contextManager.addMessageToHistory(message1);
      contextManager.addMessageToHistory(message2);
      contextManager.addMessageToHistory(message3);

      const context = contextManager.getConversationContext();
      expect(context.history[0].id).toBe('msg-1');
      expect(context.history[1].id).toBe('msg-2');
      expect(context.history[2].id).toBe('msg-3');
    });

    it('should get history', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      const history = contextManager.getHistory();

      expect(history.length).toBe(1);
      expect(history[0]).toEqual(message);
    });

    it('should get last N messages', () => {
      const messages: Message[] = [];
      for (let i = 0; i < 5; i++) {
        messages.push({
          id: `msg-${i}`,
          type: i % 2 === 0 ? 'user' : 'bot',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      messages.forEach((msg) => contextManager.addMessageToHistory(msg));

      const lastTwo = contextManager.getLastMessages(2);
      expect(lastTwo.length).toBe(2);
      expect(lastTwo[0].id).toBe('msg-3');
      expect(lastTwo[1].id).toBe('msg-4');
    });

    it('should get last N messages when N is greater than history length', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      const lastTen = contextManager.getLastMessages(10);

      expect(lastTen.length).toBe(1);
      expect(lastTen[0]).toEqual(message);
    });

    it('should get last user message', () => {
      const userMessage: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      const botMessage: Message = {
        id: 'msg-2',
        type: 'bot',
        content: 'Hi',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(userMessage);
      contextManager.addMessageToHistory(botMessage);

      const lastUserMsg = contextManager.getLastUserMessage();
      expect(lastUserMsg?.id).toBe('msg-1');
    });

    it('should get last bot message', () => {
      const userMessage: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      const botMessage: Message = {
        id: 'msg-2',
        type: 'bot',
        content: 'Hi',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(userMessage);
      contextManager.addMessageToHistory(botMessage);

      const lastBotMsg = contextManager.getLastBotMessage();
      expect(lastBotMsg?.id).toBe('msg-2');
    });

    it('should return undefined for last user message when none exist', () => {
      const botMessage: Message = {
        id: 'msg-1',
        type: 'bot',
        content: 'Hi',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(botMessage);
      const lastUserMsg = contextManager.getLastUserMessage();

      expect(lastUserMsg).toBeUndefined();
    });

    it('should return undefined for last bot message when none exist', () => {
      const userMessage: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(userMessage);
      const lastBotMsg = contextManager.getLastBotMessage();

      expect(lastBotMsg).toBeUndefined();
    });
  });

  describe('History Clearing', () => {
    it('should clear history', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      contextManager.clearHistory();

      const context = contextManager.getConversationContext();
      expect(context.history).toEqual([]);
    });

    it('should clear history at session end', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      expect(contextManager.getHistory().length).toBe(1);

      contextManager.clearHistory();
      expect(contextManager.getHistory().length).toBe(0);
    });

    it('should clear last intent when clearing history', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
        intent: {
          type: 'GENERAL_HELP',
          confidence: 0.9,
          category: 'Ayuda General',
        },
      };

      contextManager.addMessageToHistory(message);
      expect(contextManager.getLastIntent()).toBeDefined();

      contextManager.clearHistory();
      expect(contextManager.getLastIntent()).toBeUndefined();
    });

    it('should clear last entities when clearing history', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
        entities: [
          {
            type: 'MUSICIAN_NAME',
            value: 'Juan',
            confidence: 0.9,
            position: { start: 0, end: 4 },
          },
        ],
      };

      contextManager.addMessageToHistory(message);
      expect(contextManager.getLastEntities()).toBeDefined();

      contextManager.clearHistory();
      expect(contextManager.getLastEntities()).toBeUndefined();
    });
  });

  describe('Intent and Entity Tracking', () => {
    it('should track last intent from user message', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'agregar músico',
        timestamp: new Date(),
        intent: {
          type: 'MANAGE_MUSICIANS',
          confidence: 0.95,
          category: 'Gestión de Músicos',
        },
      };

      contextManager.addMessageToHistory(message);
      const lastIntent = contextManager.getLastIntent();

      expect(lastIntent?.type).toBe('MANAGE_MUSICIANS');
      expect(lastIntent?.confidence).toBe(0.95);
    });

    it('should track last entities from user message', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'agregar a Juan',
        timestamp: new Date(),
        entities: [
          {
            type: 'MUSICIAN_NAME',
            value: 'Juan',
            confidence: 0.9,
            position: { start: 8, end: 12 },
          },
        ],
      };

      contextManager.addMessageToHistory(message);
      const lastEntities = contextManager.getLastEntities();

      expect(lastEntities?.length).toBe(1);
      expect(lastEntities?.[0].value).toBe('Juan');
    });

    it('should not update intent from bot message', () => {
      const userMessage: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'agregar músico',
        timestamp: new Date(),
        intent: {
          type: 'MANAGE_MUSICIANS',
          confidence: 0.95,
          category: 'Gestión de Músicos',
        },
      };

      const botMessage: Message = {
        id: 'msg-2',
        type: 'bot',
        content: 'Aquí está la respuesta',
        timestamp: new Date(),
        intent: {
          type: 'GENERAL_HELP',
          confidence: 0.8,
          category: 'Ayuda General',
        },
      };

      contextManager.addMessageToHistory(userMessage);
      contextManager.addMessageToHistory(botMessage);

      const lastIntent = contextManager.getLastIntent();
      expect(lastIntent?.type).toBe('MANAGE_MUSICIANS');
    });
  });

  describe('History Length and Status', () => {
    it('should get history length', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      const length = contextManager.getHistoryLength();

      expect(length).toBe(1);
    });

    it('should check if history exists', () => {
      expect(contextManager.hasHistory()).toBe(false);

      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      expect(contextManager.hasHistory()).toBe(true);
    });

    it('should return false for hasHistory after clearing', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);
      expect(contextManager.hasHistory()).toBe(true);

      contextManager.clearHistory();
      expect(contextManager.hasHistory()).toBe(false);
    });
  });

  describe('Context Isolation', () => {
    it('should return copy of context, not reference', () => {
      const context1 = contextManager.getConversationContext();
      const context2 = contextManager.getConversationContext();

      expect(context1).not.toBe(context2);
      expect(context1).toEqual(context2);
    });

    it('should return copy of history, not reference', () => {
      const message: Message = {
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      contextManager.addMessageToHistory(message);

      const history1 = contextManager.getHistory();
      const history2 = contextManager.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });
});
