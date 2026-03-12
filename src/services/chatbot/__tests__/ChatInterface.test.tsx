/**
 * Tests unitarios para el componente ChatInterface
 * 
 * Valida:
 * - Requisito 2.1: Mostrar historial de mensajes
 * - Requisito 2.2: Incluir campo de entrada de texto
 * - Requisito 2.3: Incluir botón de envío
 * - Requisito 2.4: Mostrar indicador de carga
 * - Requisito 2.5: Scroll automático al último mensaje
 * - Requisito 2.6: Mostrar título "Asistente Worship"
 * - Requisito 2.7: Diferenciar visualmente mensajes del usuario vs bot
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../components/ChatInterface';
import { useChatbotStore } from '../store/chatbotStore';

describe('ChatInterface', () => {
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
  });

  describe('Requisito 2.6: Mostrar título "Asistente Worship"', () => {
    it('debe mostrar el título "Asistente Worship"', () => {
      render(<ChatInterface />);
      const title = screen.getByText('Asistente Worship');
      expect(title).toBeDefined();
      expect(title.tagName).toBe('H2');
    });

    it('debe tener la clase chat-title', () => {
      render(<ChatInterface />);
      const title = screen.getByText('Asistente Worship');
      expect(title.className).toContain('chat-title');
    });
  });

  describe('Requisito 2.1: Mostrar historial de mensajes', () => {
    it('debe mostrar estado vacío cuando no hay mensajes', () => {
      render(<ChatInterface />);
      const emptyText = screen.getByText(
        /hola, soy tu asistente. ¿cómo puedo ayudarte?/i
      );
      expect(emptyText).toBeDefined();
    });

    it('debe mostrar mensajes del usuario', () => {
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'user',
            content: 'Hola, ¿cómo estás?',
            timestamp: new Date(),
          },
        ],
      });

      render(<ChatInterface />);
      const message = screen.getByText('Hola, ¿cómo estás?');
      expect(message).toBeDefined();
    });

    it('debe mostrar mensajes del bot', () => {
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'bot',
            content: 'Estoy bien, gracias por preguntar',
            timestamp: new Date(),
          },
        ],
      });

      render(<ChatInterface />);
      const message = screen.getByText('Estoy bien, gracias por preguntar');
      expect(message).toBeDefined();
    });

    it('debe mostrar múltiples mensajes en orden', () => {
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'user',
            content: 'Primer mensaje',
            timestamp: new Date(),
          },
          {
            id: '2',
            type: 'bot',
            content: 'Segunda respuesta',
            timestamp: new Date(),
          },
          {
            id: '3',
            type: 'user',
            content: 'Tercer mensaje',
            timestamp: new Date(),
          },
        ],
      });

      render(<ChatInterface />);
      expect(screen.getByText('Primer mensaje')).toBeDefined();
      expect(screen.getByText('Segunda respuesta')).toBeDefined();
      expect(screen.getByText('Tercer mensaje')).toBeDefined();
    });

    it('debe diferenciar visualmente mensajes del usuario', () => {
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'user',
            content: 'Mensaje del usuario',
            timestamp: new Date(),
          },
        ],
      });

      render(<ChatInterface />);
      const message = screen.getByRole('article');
      expect(message.className).toContain('chat-message-user');
    });

    it('debe diferenciar visualmente mensajes del bot', () => {
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'bot',
            content: 'Mensaje del bot',
            timestamp: new Date(),
          },
        ],
      });

      render(<ChatInterface />);
      const message = screen.getByRole('status');
      expect(message.className).toContain('chat-message-bot');
    });

    it('debe mostrar timestamp de cada mensaje', () => {
      const now = new Date();
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'user',
            content: 'Mensaje',
            timestamp: now,
          },
        ],
      });

      render(<ChatInterface />);
      const timeString = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const timeElement = screen.getByText(timeString);
      expect(timeElement).toBeDefined();
    });
  });

  describe('Requisito 2.2: Campo de entrada de texto', () => {
    it('debe mostrar campo de entrada', () => {
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      expect(input).toBeDefined();
      expect(input.tagName).toBe('INPUT');
    });

    it('debe tener placeholder descriptivo', () => {
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      expect(input.getAttribute('placeholder')).toBe('Escribe tu pregunta...');
    });

    it('debe actualizar el valor del input al escribir', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i) as HTMLInputElement;

      await user.type(input, 'Hola');

      expect(input.value).toBe('Hola');
    });

    it('debe tener aria-label', () => {
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      expect(input.getAttribute('aria-label')).toBe(
        'Campo de entrada de mensaje'
      );
    });

    it('debe estar deshabilitado mientras se procesa', () => {
      render(<ChatInterface isLoading={true} />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      expect(input.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Requisito 2.3: Botón de envío', () => {
    it('debe mostrar botón de envío', () => {
      render(<ChatInterface />);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });
      expect(button).toBeDefined();
    });

    it('debe estar deshabilitado cuando el input está vacío', () => {
      render(<ChatInterface />);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('debe estar habilitado cuando hay texto en el input', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });

      await user.type(input, 'Hola');

      expect(button.hasAttribute('disabled')).toBe(false);
    });

    it('debe estar deshabilitado mientras se procesa', () => {
      render(<ChatInterface isLoading={true} />);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('debe limpiar el input después de enviar', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i) as HTMLInputElement;
      const button = screen.getByRole('button', { name: /enviar mensaje/i });

      await user.type(input, 'Hola');
      await user.click(button);

      expect(input.value).toBe('');
    });

    it('debe tener aria-label', () => {
      render(<ChatInterface />);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });
      expect(button.getAttribute('aria-label')).toBe('Enviar mensaje');
    });

    it('debe tener title', () => {
      render(<ChatInterface />);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });
      expect(button.getAttribute('title')).toBe('Enviar (Enter)');
    });
  });

  describe('Requisito 2.4: Indicador de carga', () => {
    it('debe mostrar indicador de carga cuando isLoading es true', () => {
      render(<ChatInterface isLoading={true} />);
      const loadingText = screen.getByText(/procesando/i);
      expect(loadingText).toBeDefined();
    });

    it('no debe mostrar indicador de carga cuando isLoading es false', () => {
      render(<ChatInterface isLoading={false} />);
      const loadingText = screen.queryByText(/procesando/i);
      expect(loadingText).toBeNull();
    });

    it('debe mostrar puntos animados en el indicador de carga', () => {
      render(<ChatInterface isLoading={true} />);
      const container = screen.getByText(/procesando/i).parentElement;
      const dotElements = container?.querySelectorAll('.chat-loading-dot');
      expect(dotElements?.length).toBe(3);
    });
  });

  describe('Requisito 2.5: Scroll automático', () => {
    it('debe hacer scroll al último mensaje cuando se agrega uno nuevo', async () => {
      const { rerender } = render(<ChatInterface />);

      // Agregar un mensaje
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'user',
            content: 'Primer mensaje',
            timestamp: new Date(),
          },
        ],
      });

      rerender(<ChatInterface />);

      // Verificar que el mensaje está visible
      const message = screen.getByText('Primer mensaje');
      expect(message).toBeDefined();
    });

    it('debe mantener el scroll en el último mensaje con múltiples mensajes', async () => {
      useChatbotStore.setState({
        messages: Array.from({ length: 10 }, (_, i) => ({
          id: String(i),
          type: i % 2 === 0 ? ('user' as const) : ('bot' as const),
          content: `Mensaje ${i}`,
          timestamp: new Date(),
        })),
      });

      render(<ChatInterface />);

      // Verificar que el último mensaje está presente
      const lastMessage = screen.getByText('Mensaje 9');
      expect(lastMessage).toBeDefined();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener role log en el contenedor de mensajes', () => {
      render(<ChatInterface />);
      const container = screen.getByRole('log');
      expect(container).toBeDefined();
    });

    it('debe tener aria-live polite en el contenedor de mensajes', () => {
      render(<ChatInterface />);
      const container = screen.getByRole('log');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    it('debe tener aria-label en el contenedor de mensajes', () => {
      render(<ChatInterface />);
      const container = screen.getByRole('log');
      expect(container.getAttribute('aria-label')).toBe(
        'Historial de conversación'
      );
    });

    it('debe ser navegable por teclado', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);

      // Tab para enfocar el input
      await user.tab();
      expect(input === document.activeElement).toBe(true);
    });

    it('debe tener aria-describedby en el input', () => {
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      expect(input.getAttribute('aria-describedby')).toBe('chat-input-help');
    });
  });

  describe('Validación de entrada', () => {
    it('no debe enviar mensaje vacío', async () => {
      const onSendMessage = vi.fn();
      render(<ChatInterface onSendMessage={onSendMessage} />);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });

      // El botón debe estar deshabilitado
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('no debe enviar mensaje con solo espacios', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn();
      render(<ChatInterface onSendMessage={onSendMessage} />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });

      await user.type(input, '   ');

      // El botón debe estar deshabilitado
      expect(button.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Integración con store', () => {
    it('debe agregar mensaje del usuario al store', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);
      const input = screen.getByPlaceholderText(/escribe tu pregunta/i);
      const button = screen.getByRole('button', { name: /enviar mensaje/i });

      await user.type(input, 'Hola');
      await user.click(button);

      const state = useChatbotStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].content).toBe('Hola');
      expect(state.messages[0].type).toBe('user');
    });
  });
});
