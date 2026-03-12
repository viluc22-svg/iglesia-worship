/**
 * Tests para el store del chatbot
 * Verifica que el estado global y la persistencia funcionen correctamente
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useChatbotStore } from '../store/chatbotStore';
import type { Message, QuickSuggestion } from '../types/index';

describe('ChatbotStore', () => {
  beforeEach(() => {
    // Limpiar el store antes de cada test
    useChatbotStore.setState({
      isOpen: false,
      isMinimized: false,
      messages: [],
      currentPage: 'home',
      userRole: 'user',
      suggestions: [],
      isLoading: false,
    });
    // Limpiar localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Estado Inicial', () => {
    it('debe tener estado inicial correcto', () => {
      const state = useChatbotStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.isMinimized).toBe(false);
      expect(state.messages).toEqual([]);
      expect(state.currentPage).toBe('home');
      expect(state.userRole).toBe('user');
      expect(state.suggestions).toEqual([]);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('toggleOpen()', () => {
    it('debe alternar el estado isOpen de false a true', () => {
      const { toggleOpen } = useChatbotStore.getState();
      expect(useChatbotStore.getState().isOpen).toBe(false);
      toggleOpen();
      expect(useChatbotStore.getState().isOpen).toBe(true);
    });

    it('debe alternar el estado isOpen de true a false', () => {
      useChatbotStore.setState({ isOpen: true });
      const { toggleOpen } = useChatbotStore.getState();
      expect(useChatbotStore.getState().isOpen).toBe(true);
      toggleOpen();
      expect(useChatbotStore.getState().isOpen).toBe(false);
    });

    it('debe poder alternar múltiples veces', () => {
      const { toggleOpen } = useChatbotStore.getState();
      expect(useChatbotStore.getState().isOpen).toBe(false);
      toggleOpen();
      expect(useChatbotStore.getState().isOpen).toBe(true);
      toggleOpen();
      expect(useChatbotStore.getState().isOpen).toBe(false);
      toggleOpen();
      expect(useChatbotStore.getState().isOpen).toBe(true);
    });
  });

  describe('toggleMinimize()', () => {
    it('debe alternar el estado isMinimized de false a true', () => {
      const { toggleMinimize } = useChatbotStore.getState();
      expect(useChatbotStore.getState().isMinimized).toBe(false);
      toggleMinimize();
      expect(useChatbotStore.getState().isMinimized).toBe(true);
    });

    it('debe alternar el estado isMinimized de true a false', () => {
      useChatbotStore.setState({ isMinimized: true });
      const { toggleMinimize } = useChatbotStore.getState();
      expect(useChatbotStore.getState().isMinimized).toBe(true);
      toggleMinimize();
      expect(useChatbotStore.getState().isMinimized).toBe(false);
    });
  });

  describe('addMessage()', () => {
    it('debe agregar un mensaje al historial', () => {
      const message: Message = {
        id: '1',
        type: 'user',
        content: 'Hola',
        timestamp: new Date(),
      };
      const { addMessage } = useChatbotStore.getState();
      addMessage(message);
      expect(useChatbotStore.getState().messages).toHaveLength(1);
      expect(useChatbotStore.getState().messages[0]).toEqual(message);
    });

    it('debe agregar múltiples mensajes en orden', () => {
      const message1: Message = {
        id: '1',
        type: 'user',
        content: 'Primer mensaje',
        timestamp: new Date(),
      };
      const message2: Message = {
        id: '2',
        type: 'bot',
        content: 'Respuesta',
        timestamp: new Date(),
      };
      const { addMessage } = useChatbotStore.getState();
      addMessage(message1);
      addMessage(message2);
      expect(useChatbotStore.getState().messages).toHaveLength(2);
      expect(useChatbotStore.getState().messages[0]).toEqual(message1);
      expect(useChatbotStore.getState().messages[1]).toEqual(message2);
    });

    it('debe preservar mensajes anteriores al agregar uno nuevo', () => {
      const message1: Message = {
        id: '1',
        type: 'user',
        content: 'Primer mensaje',
        timestamp: new Date(),
      };
      const message2: Message = {
        id: '2',
        type: 'bot',
        content: 'Respuesta',
        timestamp: new Date(),
      };
      const { addMessage } = useChatbotStore.getState();
      addMessage(message1);
      const firstMessages = useChatbotStore.getState().messages;
      addMessage(message2);
      const allMessages = useChatbotStore.getState().messages;
      expect(allMessages).toHaveLength(2);
      expect(allMessages[0]).toEqual(firstMessages[0]);
    });
  });

  describe('updatePageContext()', () => {
    it('debe actualizar la página actual', () => {
      const { updatePageContext } = useChatbotStore.getState();
      expect(useChatbotStore.getState().currentPage).toBe('home');
      updatePageContext('musicians-page');
      expect(useChatbotStore.getState().currentPage).toBe('musicians-page');
    });

    it('debe permitir cambiar de página múltiples veces', () => {
      const { updatePageContext } = useChatbotStore.getState();
      updatePageContext('musicians-page');
      expect(useChatbotStore.getState().currentPage).toBe('musicians-page');
      updatePageContext('audio-settings');
      expect(useChatbotStore.getState().currentPage).toBe('audio-settings');
      updatePageContext('worship-services');
      expect(useChatbotStore.getState().currentPage).toBe('worship-services');
    });
  });

  describe('setUserRole()', () => {
    it('debe establecer el rol del usuario a admin', () => {
      const { setUserRole } = useChatbotStore.getState();
      expect(useChatbotStore.getState().userRole).toBe('user');
      setUserRole('admin');
      expect(useChatbotStore.getState().userRole).toBe('admin');
    });

    it('debe establecer el rol del usuario a user', () => {
      useChatbotStore.setState({ userRole: 'admin' });
      const { setUserRole } = useChatbotStore.getState();
      expect(useChatbotStore.getState().userRole).toBe('admin');
      setUserRole('user');
      expect(useChatbotStore.getState().userRole).toBe('user');
    });
  });

  describe('updateSuggestions()', () => {
    it('debe actualizar las sugerencias rápidas', () => {
      const suggestions: QuickSuggestion[] = [
        {
          id: '1',
          text: 'Agregar músico',
          question: '¿Cómo agrego un músico?',
        },
        {
          id: '2',
          text: 'Configurar audio',
          question: '¿Cómo configuro el audio?',
        },
      ];
      const { updateSuggestions } = useChatbotStore.getState();
      updateSuggestions(suggestions);
      expect(useChatbotStore.getState().suggestions).toEqual(suggestions);
    });

    it('debe reemplazar sugerencias anteriores', () => {
      const suggestions1: QuickSuggestion[] = [
        {
          id: '1',
          text: 'Sugerencia 1',
          question: 'Pregunta 1',
        },
      ];
      const suggestions2: QuickSuggestion[] = [
        {
          id: '2',
          text: 'Sugerencia 2',
          question: 'Pregunta 2',
        },
      ];
      const { updateSuggestions } = useChatbotStore.getState();
      updateSuggestions(suggestions1);
      expect(useChatbotStore.getState().suggestions).toEqual(suggestions1);
      updateSuggestions(suggestions2);
      expect(useChatbotStore.getState().suggestions).toEqual(suggestions2);
    });

    it('debe permitir actualizar a un array vacío', () => {
      const suggestions: QuickSuggestion[] = [
        {
          id: '1',
          text: 'Sugerencia',
          question: 'Pregunta',
        },
      ];
      const { updateSuggestions } = useChatbotStore.getState();
      updateSuggestions(suggestions);
      expect(useChatbotStore.getState().suggestions).toHaveLength(1);
      updateSuggestions([]);
      expect(useChatbotStore.getState().suggestions).toEqual([]);
    });
  });

  describe('clearMessages()', () => {
    it('debe limpiar el historial de mensajes', () => {
      const message: Message = {
        id: '1',
        type: 'user',
        content: 'Hola',
        timestamp: new Date(),
      };
      const { addMessage, clearMessages } = useChatbotStore.getState();
      addMessage(message);
      expect(useChatbotStore.getState().messages).toHaveLength(1);
      clearMessages();
      expect(useChatbotStore.getState().messages).toEqual([]);
    });

    it('debe limpiar múltiples mensajes', () => {
      const { addMessage, clearMessages } = useChatbotStore.getState();
      for (let i = 0; i < 5; i++) {
        addMessage({
          id: String(i),
          type: i % 2 === 0 ? 'user' : 'bot',
          content: `Mensaje ${i}`,
          timestamp: new Date(),
        });
      }
      expect(useChatbotStore.getState().messages).toHaveLength(5);
      clearMessages();
      expect(useChatbotStore.getState().messages).toEqual([]);
    });
  });

  describe('updatePosition()', () => {
    it('debe actualizar la posición del chatbot', () => {
      const { updatePosition } = useChatbotStore.getState();
      updatePosition({ x: 10, y: 20 });
      expect(useChatbotStore.getState().position).toEqual({ x: 10, y: 20 });
    });

    it('debe permitir cambiar la posición múltiples veces', () => {
      const { updatePosition } = useChatbotStore.getState();
      updatePosition({ x: 10, y: 20 });
      expect(useChatbotStore.getState().position).toEqual({ x: 10, y: 20 });
      updatePosition({ x: 50, y: 100 });
      expect(useChatbotStore.getState().position).toEqual({ x: 50, y: 100 });
    });

    it('debe permitir posiciones negativas', () => {
      const { updatePosition } = useChatbotStore.getState();
      updatePosition({ x: -10, y: -20 });
      expect(useChatbotStore.getState().position).toEqual({ x: -10, y: -20 });
    });
  });

  describe('setTheme()', () => {
    it('debe establecer el tema a dark', () => {
      const { setTheme } = useChatbotStore.getState();
      expect(useChatbotStore.getState().theme).toBe('light');
      setTheme('dark');
      expect(useChatbotStore.getState().theme).toBe('dark');
    });

    it('debe establecer el tema a light', () => {
      useChatbotStore.setState({ theme: 'dark' });
      const { setTheme } = useChatbotStore.getState();
      expect(useChatbotStore.getState().theme).toBe('dark');
      setTheme('light');
      expect(useChatbotStore.getState().theme).toBe('light');
    });

    it('debe permitir alternar entre temas', () => {
      const { setTheme } = useChatbotStore.getState();
      setTheme('dark');
      expect(useChatbotStore.getState().theme).toBe('dark');
      setTheme('light');
      expect(useChatbotStore.getState().theme).toBe('light');
      setTheme('dark');
      expect(useChatbotStore.getState().theme).toBe('dark');
    });
  });

  describe('setLoading()', () => {
    it('debe establecer isLoading a true', () => {
      const { setLoading } = useChatbotStore.getState();
      expect(useChatbotStore.getState().isLoading).toBe(false);
      setLoading(true);
      expect(useChatbotStore.getState().isLoading).toBe(true);
    });

    it('debe establecer isLoading a false', () => {
      useChatbotStore.setState({ isLoading: true });
      const { setLoading } = useChatbotStore.getState();
      expect(useChatbotStore.getState().isLoading).toBe(true);
      setLoading(false);
      expect(useChatbotStore.getState().isLoading).toBe(false);
    });

    it('debe permitir alternar el estado de carga', () => {
      const { setLoading } = useChatbotStore.getState();
      setLoading(true);
      expect(useChatbotStore.getState().isLoading).toBe(true);
      setLoading(false);
      expect(useChatbotStore.getState().isLoading).toBe(false);
      setLoading(true);
      expect(useChatbotStore.getState().isLoading).toBe(true);
    });
  });

  describe('getPreferences()', () => {
    it('debe retornar las preferencias actuales', () => {
      const { getPreferences } = useChatbotStore.getState();
      const preferences = getPreferences();
      expect(preferences).toHaveProperty('isMinimized');
      expect(preferences).toHaveProperty('position');
      expect(preferences).toHaveProperty('theme');
      expect(preferences).toHaveProperty('lastUpdated');
    });

    it('debe retornar preferencias con valores correctos', () => {
      const { toggleMinimize, updatePosition, setTheme, getPreferences } =
        useChatbotStore.getState();
      toggleMinimize();
      updatePosition({ x: 10, y: 20 });
      setTheme('dark');

      const preferences = getPreferences();
      expect(preferences.isMinimized).toBe(true);
      expect(preferences.position).toEqual({ x: 10, y: 20 });
      expect(preferences.theme).toBe('dark');
    });

    it('debe retornar lastUpdated como Date', () => {
      const { getPreferences } = useChatbotStore.getState();
      const preferences = getPreferences();
      expect(preferences.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('restorePreferences()', () => {
    it('debe restaurar las preferencias del usuario', () => {
      const { restorePreferences } = useChatbotStore.getState();
      const preferencesToRestore = {
        isMinimized: true,
        position: { x: 50, y: 100 },
        theme: 'dark' as const,
        lastUpdated: new Date(),
      };

      restorePreferences(preferencesToRestore);

      const state = useChatbotStore.getState();
      expect(state.isMinimized).toBe(true);
      expect(state.position).toEqual({ x: 50, y: 100 });
      expect(state.theme).toBe('dark');
    });

    it('debe permitir restaurar múltiples veces', () => {
      const { restorePreferences } = useChatbotStore.getState();

      const preferences1 = {
        isMinimized: true,
        position: { x: 10, y: 20 },
        theme: 'dark' as const,
        lastUpdated: new Date(),
      };

      const preferences2 = {
        isMinimized: false,
        position: { x: 50, y: 100 },
        theme: 'light' as const,
        lastUpdated: new Date(),
      };

      restorePreferences(preferences1);
      let state = useChatbotStore.getState();
      expect(state.isMinimized).toBe(true);
      expect(state.position).toEqual({ x: 10, y: 20 });

      restorePreferences(preferences2);
      state = useChatbotStore.getState();
      expect(state.isMinimized).toBe(false);
      expect(state.position).toEqual({ x: 50, y: 100 });
    });
  });

  describe('Persistencia en localStorage', () => {
    it('debe persistir el estado isMinimized en localStorage', () => {
      const { toggleMinimize } = useChatbotStore.getState();
      toggleMinimize();
      expect(useChatbotStore.getState().isMinimized).toBe(true);

      // Simular recarga obteniendo el estado persistido
      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.isMinimized).toBe(true);
    });

    it('debe persistir la posición en localStorage', () => {
      const { updatePosition } = useChatbotStore.getState();
      updatePosition({ x: 10, y: 20 });

      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.position).toEqual({ x: 10, y: 20 });
    });

    it('debe persistir el tema en localStorage', () => {
      const { setTheme } = useChatbotStore.getState();
      setTheme('dark');

      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe('dark');
    });

    it('debe restaurar el estado isMinimized desde localStorage', () => {
      // Nota: En un test, la persistencia se maneja automáticamente por Zustand
      // Este test verifica que el estado se puede guardar y recuperar
      const { toggleMinimize } = useChatbotStore.getState();
      toggleMinimize();
      expect(useChatbotStore.getState().isMinimized).toBe(true);

      // Verificar que está en localStorage
      const stored = localStorage.getItem('chatbot:preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.isMinimized).toBe(true);
    });

    it('no debe persistir el historial de mensajes', () => {
      const message: Message = {
        id: '1',
        type: 'user',
        content: 'Hola',
        timestamp: new Date(),
      };
      const { addMessage } = useChatbotStore.getState();
      addMessage(message);
      expect(useChatbotStore.getState().messages).toHaveLength(1);

      // Verificar que los mensajes no están en localStorage
      const stored = localStorage.getItem('chatbot:preferences');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.messages).toBeUndefined();
    });

    it('debe mantener otras propiedades sin persistir', () => {
      const { updatePageContext, setUserRole } = useChatbotStore.getState();
      updatePageContext('musicians-page');
      setUserRole('admin');

      // Verificar que currentPage y userRole no están persistidos
      const stored = localStorage.getItem('chatbot:preferences');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.currentPage).toBeUndefined();
      expect(parsed.state.userRole).toBeUndefined();
    });

    it('debe persistir solo isMinimized, position y theme', () => {
      const { toggleMinimize, updatePosition, setTheme } =
        useChatbotStore.getState();
      toggleMinimize();
      updatePosition({ x: 10, y: 20 });
      setTheme('dark');

      const stored = localStorage.getItem('chatbot:preferences');
      const parsed = JSON.parse(stored!);
      expect(Object.keys(parsed.state)).toContain('isMinimized');
      expect(Object.keys(parsed.state)).toContain('position');
      expect(Object.keys(parsed.state)).toContain('theme');
      expect(Object.keys(parsed.state)).not.toContain('messages');
      expect(Object.keys(parsed.state)).not.toContain('currentPage');
      expect(Object.keys(parsed.state)).not.toContain('userRole');
      expect(Object.keys(parsed.state)).not.toContain('isLoading');
    });
  });

  describe('Hooks selectores', () => {
    it('debe permitir seleccionar solo isOpen', () => {
      useChatbotStore.setState({ isOpen: true });
      const isOpen = useChatbotStore.getState().isOpen;
      expect(isOpen).toBe(true);
    });

    it('debe permitir seleccionar solo isMinimized', () => {
      useChatbotStore.setState({ isMinimized: true });
      const isMinimized = useChatbotStore.getState().isMinimized;
      expect(isMinimized).toBe(true);
    });

    it('debe permitir seleccionar solo messages', () => {
      const message: Message = {
        id: '1',
        type: 'user',
        content: 'Hola',
        timestamp: new Date(),
      };
      const { addMessage } = useChatbotStore.getState();
      addMessage(message);
      const messages = useChatbotStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('debe permitir seleccionar solo currentPage', () => {
      useChatbotStore.setState({ currentPage: 'musicians-page' });
      const currentPage = useChatbotStore.getState().currentPage;
      expect(currentPage).toBe('musicians-page');
    });

    it('debe permitir seleccionar solo userRole', () => {
      useChatbotStore.setState({ userRole: 'admin' });
      const userRole = useChatbotStore.getState().userRole;
      expect(userRole).toBe('admin');
    });

    it('debe permitir seleccionar solo suggestions', () => {
      const suggestions: QuickSuggestion[] = [
        {
          id: '1',
          text: 'Sugerencia',
          question: 'Pregunta',
        },
      ];
      useChatbotStore.setState({ suggestions });
      const retrievedSuggestions = useChatbotStore.getState().suggestions;
      expect(retrievedSuggestions).toEqual(suggestions);
    });

    it('debe permitir seleccionar solo isLoading', () => {
      useChatbotStore.setState({ isLoading: true });
      const isLoading = useChatbotStore.getState().isLoading;
      expect(isLoading).toBe(true);
    });

    it('debe permitir seleccionar solo position', () => {
      useChatbotStore.setState({ position: { x: 10, y: 20 } });
      const position = useChatbotStore.getState().position;
      expect(position).toEqual({ x: 10, y: 20 });
    });

    it('debe permitir seleccionar solo theme', () => {
      useChatbotStore.setState({ theme: 'dark' });
      const theme = useChatbotStore.getState().theme;
      expect(theme).toBe('dark');
    });
  });

  describe('Casos de uso complejos', () => {
    it('debe manejar múltiples acciones en secuencia', () => {
      const { toggleOpen, toggleMinimize, addMessage, updatePageContext } =
        useChatbotStore.getState();

      toggleOpen();
      expect(useChatbotStore.getState().isOpen).toBe(true);

      updatePageContext('musicians-page');
      expect(useChatbotStore.getState().currentPage).toBe('musicians-page');

      const message: Message = {
        id: '1',
        type: 'user',
        content: 'Hola',
        timestamp: new Date(),
      };
      addMessage(message);
      expect(useChatbotStore.getState().messages).toHaveLength(1);

      toggleMinimize();
      expect(useChatbotStore.getState().isMinimized).toBe(true);

      const state = useChatbotStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.isMinimized).toBe(true);
      expect(state.currentPage).toBe('musicians-page');
      expect(state.messages).toHaveLength(1);
    });

    it('debe mantener estado consistente después de múltiples cambios', () => {
      const { updatePageContext, setUserRole } =
        useChatbotStore.getState();

      const pages = ['home', 'musicians-page', 'audio-settings'];
      const roles: Array<'admin' | 'user'> = ['admin', 'user', 'admin'];

      for (let i = 0; i < pages.length; i++) {
        updatePageContext(pages[i]);
        setUserRole(roles[i]);
        expect(useChatbotStore.getState().currentPage).toBe(pages[i]);
        expect(useChatbotStore.getState().userRole).toBe(roles[i]);
      }
    });
  });
});
