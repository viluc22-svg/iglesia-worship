/**
 * ChatbotWidget - Botón Flotante del Chatbot
 * 
 * Componente que renderiza un botón flotante en la esquina inferior derecha
 * de la pantalla. Incluye:
 * - Icono de chat
 * - Badge con contador de mensajes no leídos
 * - Animación de entrada/salida
 * - Conexión con el store de Zustand para estado isOpen e isMinimized
 * - Manejo de click para abrir/cerrar la interfaz
 * 
 * Requisitos: 1.1, 1.2, 1.3
 */

import React, { useState } from 'react';
import { useChatbotStore } from '../store/chatbotStore';
import { ChatInterface } from './ChatInterface';
import './ChatbotWidget.css';

/**
 * Props del componente ChatbotWidget
 */
interface ChatbotWidgetProps {
  /**
   * Callback opcional cuando se abre/cierra el widget
   */
  onToggle?: (isOpen: boolean) => void;
}

/**
 * Componente ChatbotWidget
 * Renderiza un botón flotante que abre/cierra la interfaz de chat
 */
export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ onToggle }) => {
  const { isOpen, isMinimized, messages, toggleOpen, toggleMinimize } =
    useChatbotStore();
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Calcula el número de mensajes no leídos
   * (mensajes del bot que no han sido vistos)
   */
  const unreadCount = messages.filter(
    (msg) => msg.type === 'bot'
  ).length;

  /**
   * Maneja el click en el botón flotante
   * Alterna entre abrir/cerrar la interfaz
   */
  const handleClick = () => {
    setIsAnimating(true);
    toggleOpen();
    onToggle?.(!isOpen);

    // Remover clase de animación después de que termine
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  /**
   * Maneja el click en el botón de minimizar
   * Previene que se cierre la interfaz
   */
  const handleMinimizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMinimize();
  };

  return (
    <>
      {/* Botón flotante principal */}
      <button
        className={`chatbot-widget ${isOpen ? 'open' : 'closed'} ${
          isAnimating ? 'animating' : ''
        }`}
        onClick={handleClick}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={isOpen}
        title={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        {/* Icono de chat */}
        <svg
          className="chatbot-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        {/* Badge con contador de mensajes no leídos */}
        {unreadCount > 0 && (
          <span
            className="chatbot-badge"
            aria-label={`${unreadCount} mensajes no leídos`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de interfaz de chat (cuando está abierto) */}
      {isOpen && (
        <div
          className={`chatbot-panel ${isMinimized ? 'minimized' : 'expanded'}`}
          role="dialog"
          aria-label="Asistente Worship"
          aria-modal="true"
        >
          {/* Encabezado del panel */}
          <div className="chatbot-header">
            <h2 className="chatbot-title">Asistente Worship</h2>
            <div className="chatbot-controls">
              {/* Botón de minimizar */}
              <button
                className="chatbot-minimize-btn"
                onClick={handleMinimizeClick}
                aria-label={
                  isMinimized ? 'Expandir asistente' : 'Minimizar asistente'
                }
                aria-expanded={!isMinimized}
                title={isMinimized ? 'Expandir' : 'Minimizar'}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {isMinimized ? (
                    // Icono de expandir
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  ) : (
                    // Icono de minimizar
                    <path d="M8 19H5a2 2 0 0 1-2-2v-3m18 0v3a2 2 0 0 1-2 2h-3m0-18h3a2 2 0 0 1 2 2v3M3 8v3a2 2 0 0 0 2 2h3" />
                  )}
                </svg>
              </button>

              {/* Botón de cerrar */}
              <button
                className="chatbot-close-btn"
                onClick={handleClick}
                aria-label="Cerrar asistente"
                title="Cerrar"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del panel (solo visible si no está minimizado) */}
          {!isMinimized && (
            <div className="chatbot-content">
              <ChatInterface />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
