/**
 * Tests unitarios para el componente ChatbotWidget
 * 
 * Valida:
 * - Requisito 1.1: Mostrar botón flotante en esquina inferior derecha
 * - Requisito 1.2: Abrir/cerrar interfaz al hacer click
 * - Requisito 1.3: Mostrar badge con contador de mensajes no leídos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotWidget } from '../components/ChatbotWidget';
import { useChatbotStore } from '../store/chatbotStore';

describe('ChatbotWidget', () => {
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

  describe('Requisito 1.1: Botón flotante en esquina inferior derecha', () => {
    it('debe renderizar el botón flotante', () => {
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('debe tener la clase chatbot-widget', () => {
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });
      expect(button).toHaveClass('chatbot-widget');
    });

    it('debe mostrar un icono de chat', () => {
      render(<ChatbotWidget />);
      const svg = screen.getByRole('button', {
        name: /abrir asistente/i,
      }).querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('chatbot-icon');
    });
  });

  describe('Requisito 1.2: Abrir/cerrar interfaz', () => {
    it('debe abrir la interfaz al hacer click en el botón', async () => {
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });

      fireEvent.click(button);

      // Verificar que el panel está visible
      const panel = screen.getByRole('dialog', {
        name: /asistente worship/i,
      });
      expect(panel).toBeInTheDocument();
    });

    it('debe cerrar la interfaz al hacer click nuevamente', async () => {
      useChatbotStore.setState({ isOpen: true });

      render(<ChatbotWidget />);
      const buttons = screen.getAllByRole('button', {
        name: /cerrar asistente/i,
      });
      // Usar el botón principal (el primero)
      const button = buttons[0];

      fireEvent.click(button);

      // Verificar que el panel no está visible
      const panel = screen.queryByRole('dialog', {
        name: /asistente worship/i,
      });
      expect(panel).not.toBeInTheDocument();
    });

    it('debe llamar al callback onToggle cuando se abre/cierra', async () => {
      const onToggle = vi.fn();
      render(<ChatbotWidget onToggle={onToggle} />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });

      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('debe tener aria-expanded correcto', () => {
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });

      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Requisito 1.3: Badge con contador de mensajes no leídos', () => {
    it('no debe mostrar badge cuando no hay mensajes', () => {
      render(<ChatbotWidget />);
      const badge = screen.queryByText(/\d+/);
      expect(badge).not.toBeInTheDocument();
    });

    it('debe mostrar badge con contador cuando hay mensajes del bot', () => {
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'bot',
            content: 'Hola',
            timestamp: new Date(),
          },
          {
            id: '2',
            type: 'bot',
            content: 'Cómo estás',
            timestamp: new Date(),
          },
        ],
      });

      render(<ChatbotWidget />);
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('chatbot-badge');
    });

    it('debe mostrar 9+ cuando hay más de 9 mensajes', () => {
      const messages = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        type: 'bot' as const,
        content: `Mensaje ${i}`,
        timestamp: new Date(),
      }));

      useChatbotStore.setState({ messages });

      render(<ChatbotWidget />);
      const badge = screen.getByText('9+');
      expect(badge).toBeInTheDocument();
    });

    it('debe tener aria-label descriptivo en el badge', () => {
      useChatbotStore.setState({
        messages: [
          {
            id: '1',
            type: 'bot',
            content: 'Hola',
            timestamp: new Date(),
          },
        ],
      });

      render(<ChatbotWidget />);
      const badge = screen.getByText('1');
      expect(badge).toHaveAttribute('aria-label', '1 mensajes no leídos');
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener aria-label en el botón', () => {
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });
      expect(button).toHaveAttribute('aria-label');
    });

    it('debe tener title en el botón', () => {
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });
      expect(button).toHaveAttribute('title');
    });

    it('debe ser navegable por teclado', async () => {
      const user = userEvent.setup();
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });

      // Tab para enfocar
      await user.tab();
      expect(button).toHaveFocus();

      // Enter para activar
      await user.keyboard('{Enter}');
      const panel = screen.getByRole('dialog', {
        name: /asistente worship/i,
      });
      expect(panel).toBeInTheDocument();
    });

    it('debe tener role dialog en el panel', () => {
      useChatbotStore.setState({ isOpen: true });
      render(<ChatbotWidget />);
      const panel = screen.getByRole('dialog', {
        name: /asistente worship/i,
      });
      expect(panel).toHaveAttribute('role', 'dialog');
      expect(panel).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Minimizar/Expandir', () => {
    it('debe mostrar botón de minimizar cuando el panel está abierto', () => {
      useChatbotStore.setState({ isOpen: true });
      render(<ChatbotWidget />);
      const minimizeBtn = screen.getByRole('button', {
        name: /minimizar asistente/i,
      });
      expect(minimizeBtn).toBeInTheDocument();
    });

    it('debe minimizar el panel al hacer click en el botón de minimizar', () => {
      useChatbotStore.setState({ isOpen: true, isMinimized: false });
      render(<ChatbotWidget />);
      const minimizeBtn = screen.getByRole('button', {
        name: /minimizar asistente/i,
      });

      fireEvent.click(minimizeBtn);

      const panel = screen.getByRole('dialog', {
        name: /asistente worship/i,
      });
      expect(panel).toHaveClass('minimized');
    });

    it('debe expandir el panel al hacer click en el botón de expandir', () => {
      useChatbotStore.setState({ isOpen: true, isMinimized: true });
      render(<ChatbotWidget />);
      const expandBtn = screen.getByRole('button', {
        name: /expandir asistente/i,
      });

      fireEvent.click(expandBtn);

      const panel = screen.getByRole('dialog', {
        name: /asistente worship/i,
      });
      expect(panel).not.toHaveClass('minimized');
    });

    it('no debe cerrar el panel al hacer click en minimizar', () => {
      useChatbotStore.setState({ isOpen: true });
      render(<ChatbotWidget />);
      const minimizeBtn = screen.getByRole('button', {
        name: /minimizar asistente/i,
      });

      fireEvent.click(minimizeBtn);

      const panel = screen.getByRole('dialog', {
        name: /asistente worship/i,
      });
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Contenido del panel', () => {
    it('debe mostrar título "Asistente Worship"', () => {
      useChatbotStore.setState({ isOpen: true });
      render(<ChatbotWidget />);
      const titles = screen.getAllByRole('heading', { name: 'Asistente Worship' });
      expect(titles.length).toBeGreaterThan(0);
      // Verificar que al menos uno tiene la clase chatbot-title
      const chatbotTitle = titles.find((t) => t.classList.contains('chatbot-title'));
      expect(chatbotTitle).toBeInTheDocument();
    });

    it('debe mostrar contenido cuando no está minimizado', () => {
      useChatbotStore.setState({ isOpen: true, isMinimized: false });
      render(<ChatbotWidget />);
      const content = screen.getByText(/hola, soy tu asistente/i);
      expect(content).toBeInTheDocument();
    });

    it('no debe mostrar contenido cuando está minimizado', () => {
      useChatbotStore.setState({ isOpen: true, isMinimized: true });
      render(<ChatbotWidget />);
      const content = screen.queryByText(/hola, soy tu asistente/i);
      expect(content).not.toBeInTheDocument();
    });
  });

  describe('Animaciones', () => {
    it('debe agregar clase animating al hacer click', () => {
      render(<ChatbotWidget />);
      const button = screen.getByRole('button', {
        name: /abrir asistente/i,
      });

      fireEvent.click(button);

      expect(button).toHaveClass('animating');
    });
  });
});
