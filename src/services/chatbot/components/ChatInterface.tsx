/**
 * ChatInterface - Panel Principal de Conversación
 * 
 * Componente que renderiza la interfaz principal de chat incluyendo:
 * - Título "Asistente Worship"
 * - Área de historial de mensajes con scroll automático
 * - Campo de entrada de texto
 * - Botón de envío
 * - Indicador de carga mientras se procesa respuesta
 * - Diferenciación visual entre mensajes del usuario y del bot
 * - Responsividad para mobile, tablet y desktop
 * - Accesibilidad (ARIA, navegación por teclado)
 * 
 * Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import React, { useEffect, useRef, useState } from 'react';
import { useChatbotStore } from '../store/chatbotStore';
import { QuickSuggestionsPanel } from './QuickSuggestionsPanel';
import type { Message, QuickSuggestion } from '../types/index';
import './ChatInterface.css';

/**
 * Props del componente ChatInterface
 */
interface ChatInterfaceProps {
  /**
   * Callback cuando se envía un mensaje
   */
  onSendMessage?: (message: string) => void;
  /**
   * Indica si el chatbot está procesando una respuesta
   */
  isLoading?: boolean;
}

/**
 * Componente ChatInterface
 * Renderiza la interfaz principal de conversación
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  isLoading = false,
}) => {
  const { messages, addMessage, suggestions } = useChatbotStore();
  const [inputValue, setInputValue] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Usar isLoading prop o estado local
  const isProcessing = isLoading || localIsLoading;

  /**
   * Scroll automático al último mensaje
   * Se ejecuta cuando hay nuevos mensajes
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Función para hacer scroll al final del historial
   */
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView?.({ behavior: 'smooth' });
    }
  };

  /**
   * Maneja el envío de un mensaje
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el mensaje no esté vacío
    if (!inputValue.trim()) {
      return;
    }

    // Crear mensaje del usuario
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario al historial
    addMessage(userMessage);

    // Limpiar input
    setInputValue('');

    // Llamar callback si existe
    if (onSendMessage) {
      setLocalIsLoading(true);
      try {
        await onSendMessage(userMessage.content);
      } finally {
        setLocalIsLoading(false);
      }
    }

    // Enfocar input nuevamente
    inputRef.current?.focus();
  };

  /**
   * Maneja cambios en el input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  /**
   * Maneja tecla Enter en el input
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  /**
   * Maneja el click en una sugerencia rápida
   * Envía la pregunta de la sugerencia al chatbot
   */
  const handleSuggestionClick = (suggestion: QuickSuggestion) => {
    setInputValue(suggestion.question);
    // Enfocar el input para que el usuario vea que se llenó
    inputRef.current?.focus();
  };

  return (
    <div className="chat-interface">
      {/* Encabezado con título */}
      <div className="chat-header">
        <h2 className="chat-title">Asistente Worship</h2>
      </div>

      {/* Área de historial de mensajes */}
      <div
        className="chat-messages-container"
        ref={messagesContainerRef}
        role="log"
        aria-label="Historial de conversación"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && !isProcessing ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <svg
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
            </div>
            <p className="chat-empty-text">
              Hola, soy tu asistente. ¿Cómo puedo ayudarte?
            </p>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message chat-message-${message.type}`}
                role={message.type === 'user' ? 'article' : 'status'}
              >
                <div className="chat-message-avatar">
                  {message.type === 'user' ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  )}
                </div>
                <div className="chat-message-content">
                  <p className="chat-message-text">{message.content}</p>
                  <span className="chat-message-time">
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Indicador de carga */}
            {isProcessing && (
              <div className="chat-message chat-message-bot">
                <div className="chat-message-avatar">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
                <div className="chat-message-content">
                  <div className="chat-loading-indicator">
                    <span className="chat-loading-dot"></span>
                    <span className="chat-loading-dot"></span>
                    <span className="chat-loading-dot"></span>
                  </div>
                  <span className="chat-loading-text">Procesando...</span>
                </div>
              </div>
            )}

            {/* Referencia para scroll automático */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Área de entrada de texto y botón de envío */}
      <form
        className="chat-input-form"
        onSubmit={handleSendMessage}
        role="search"
      >
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Escribe tu pregunta..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          aria-label="Campo de entrada de mensaje"
          aria-describedby="chat-input-help"
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={isProcessing || !inputValue.trim()}
          aria-label="Enviar mensaje"
          title="Enviar (Enter)"
        >
          {isProcessing ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chat-send-icon-loading"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4380088 C3.03521743,10.5951061 3.19218622,10.7522035 3.50612381,10.7522035 L16.6915026,11.5376905 C16.6915026,11.5376905 17.1624089,11.5376905 17.1624089,12.0089827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
            </svg>
          )}
        </button>
      </form>

      {/* Texto de ayuda para accesibilidad */}
      <span id="chat-input-help" className="sr-only">
        Presiona Enter para enviar tu mensaje
      </span>

      {/* Panel de sugerencias rápidas */}
      {suggestions.length > 0 && (
        <QuickSuggestionsPanel
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
    </div>
  );
};

export default ChatInterface;
