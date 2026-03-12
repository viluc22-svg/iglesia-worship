/**
 * ConversationManager - Gestor de Conversación
 * 
 * Servicio que gestiona el flujo de conversación y el historial de mensajes.
 * Mantiene el historial ordenado cronológicamente y permite limpiarlo cuando sea necesario.
 * 
 * Requisitos: 8.1, 8.3, 8.4, 8.5, 8.6
 */

import type { Message } from '../types/index';

/**
 * Servicio para gestionar la conversación
 */
export class ConversationManager {
  /**
   * Historial de mensajes de la conversación
   */
  private history: Message[] = [];

  /**
   * Agrega un mensaje al historial
   * 
   * @param message - Mensaje a agregar
   */
  public addMessage(message: Message): void {
    this.history.push(message);
  }

  /**
   * Obtiene el historial completo de mensajes
   * 
   * @returns Array de mensajes en orden cronológico
   */
  public getHistory(): Message[] {
    return [...this.history];
  }

  /**
   * Obtiene los últimos N mensajes
   * 
   * @param count - Número de mensajes a obtener
   * @returns Array de últimos mensajes
   */
  public getLastMessages(count: number): Message[] {
    if (count <= 0) {
      return [];
    }

    return this.history.slice(-count);
  }

  /**
   * Obtiene el último mensaje
   * 
   * @returns Último mensaje o undefined si el historial está vacío
   */
  public getLastMessage(): Message | undefined {
    return this.history[this.history.length - 1];
  }

  /**
   * Obtiene el número de mensajes en el historial
   * 
   * @returns Número de mensajes
   */
  public getMessageCount(): number {
    return this.history.length;
  }

  /**
   * Verifica si hay mensajes en el historial
   * 
   * @returns true si hay mensajes, false si está vacío
   */
  public hasMessages(): boolean {
    return this.history.length > 0;
  }

  /**
   * Limpia el historial de mensajes
   */
  public clearHistory(): void {
    this.history = [];
  }

  /**
   * Obtiene mensajes de un tipo específico
   * 
   * @param type - Tipo de mensaje ('user' o 'bot')
   * @returns Array de mensajes del tipo especificado
   */
  public getMessagesByType(type: 'user' | 'bot'): Message[] {
    return this.history.filter((msg) => msg.type === type);
  }

  /**
   * Obtiene el número de mensajes de un tipo específico
   * 
   * @param type - Tipo de mensaje ('user' o 'bot')
   * @returns Número de mensajes del tipo especificado
   */
  public getMessageCountByType(type: 'user' | 'bot'): number {
    return this.getMessagesByType(type).length;
  }

  /**
   * Obtiene mensajes dentro de un rango de tiempo
   * 
   * @param startTime - Tiempo de inicio
   * @param endTime - Tiempo de fin
   * @returns Array de mensajes dentro del rango
   */
  public getMessagesByTimeRange(startTime: Date, endTime: Date): Message[] {
    return this.history.filter(
      (msg) => msg.timestamp >= startTime && msg.timestamp <= endTime
    );
  }

  /**
   * Elimina un mensaje específico por ID
   * 
   * @param messageId - ID del mensaje a eliminar
   * @returns true si se eliminó, false si no se encontró
   */
  public removeMessage(messageId: string): boolean {
    const index = this.history.findIndex((msg) => msg.id === messageId);
    if (index !== -1) {
      this.history.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Obtiene un mensaje específico por ID
   * 
   * @param messageId - ID del mensaje
   * @returns Mensaje encontrado o undefined
   */
  public getMessageById(messageId: string): Message | undefined {
    return this.history.find((msg) => msg.id === messageId);
  }

  /**
   * Obtiene el índice de un mensaje en el historial
   * 
   * @param messageId - ID del mensaje
   * @returns Índice del mensaje o -1 si no se encuentra
   */
  public getMessageIndex(messageId: string): number {
    return this.history.findIndex((msg) => msg.id === messageId);
  }

  /**
   * Obtiene los últimos N mensajes del usuario
   * 
   * @param count - Número de mensajes a obtener
   * @returns Array de últimos mensajes del usuario
   */
  public getLastUserMessages(count: number): Message[] {
    const userMessages = this.getMessagesByType('user');
    return userMessages.slice(-count);
  }

  /**
   * Obtiene los últimos N mensajes del bot
   * 
   * @param count - Número de mensajes a obtener
   * @returns Array de últimos mensajes del bot
   */
  public getLastBotMessages(count: number): Message[] {
    const botMessages = this.getMessagesByType('bot');
    return botMessages.slice(-count);
  }

  /**
   * Exporta el historial como JSON
   * 
   * @returns String JSON del historial
   */
  public exportAsJSON(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Importa un historial desde JSON
   * 
   * @param json - String JSON del historial
   * @returns true si se importó correctamente, false si hay error
   */
  public importFromJSON(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.history = imported.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export default ConversationManager;
