/**
 * ContextManager - Gestor de Contexto
 * 
 * Servicio que mantiene el contexto de la conversación y la página actual.
 * Gestiona el historial de mensajes y proporciona contexto para respuestas.
 * Detecta el rol del usuario actual desde localStorage.
 * 
 * Requisitos: 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.3, 8.4, 8.5, 12.1, 12.2, 12.3, 12.4, 12.5
 */

import type {
  ConversationContext,
  Message,
  UserRole,
  Intent,
  Entity,
} from '../types/index';

/**
 * Interfaz para el usuario almacenado en localStorage
 */
interface StoredUser {
  email: string;
  name: string;
  role: UserRole;
  [key: string]: any;
}

/**
 * Servicio para gestionar el contexto de la conversación
 */
export class ContextManager {
  /**
   * Contexto actual de la conversación
   */
  private context: ConversationContext = {
    currentPage: 'home',
    userRole: 'user',
    history: [],
  };

  /**
   * Constructor que detecta automáticamente el rol del usuario actual
   */
  constructor() {
    this.detectCurrentUserRole();
  }

  /**
   * Detecta el rol del usuario actual desde localStorage
   * Busca el usuario almacenado en 'worship_user' y extrae su rol
   * 
   * Requisitos: 12.1, 12.2, 12.3
   */
  private detectCurrentUserRole(): void {
    try {
      const userJson = localStorage.getItem('worship_user');
      if (userJson) {
        const user: StoredUser = JSON.parse(userJson);
        if (user.role && (user.role === 'admin' || user.role === 'user')) {
          this.context.userRole = user.role;
        }
      }
    } catch (error) {
      // Si hay error al parsear, mantener rol por defecto 'user'
      console.warn('Failed to detect user role from localStorage', error);
    }
  }

  /**
   * Actualiza el contexto de página actual
   * 
   * @param page - Nombre de la página actual
   */
  public updatePageContext(page: string): void {
    this.context.currentPage = page;
  }

  /**
   * Establece el rol del usuario
   * 
   * @param role - Rol del usuario (admin o user)
   */
  public setUserRole(role: UserRole): void {
    this.context.userRole = role;
  }

  /**
   * Actualiza el rol del usuario detectando desde localStorage
   * Útil cuando el usuario inicia/cierra sesión
   * 
   * Requisitos: 12.1, 12.2, 12.3
   */
  public updateUserRoleFromStorage(): void {
    this.detectCurrentUserRole();
  }

  /**
   * Obtiene el contexto actual de la conversación
   * 
   * @returns Contexto actual
   */
  public getConversationContext(): ConversationContext {
    return {
      ...this.context,
      history: [...this.context.history],
    };
  }

  /**
   * Agrega un mensaje al historial
   * 
   * @param message - Mensaje a agregar
   */
  public addMessageToHistory(message: Message): void {
    this.context.history.push(message);

    // Actualizar última intención y entidades si el mensaje es del usuario
    if (message.type === 'user') {
      if (message.intent) {
        this.context.lastIntent = message.intent;
      }
      if (message.entities) {
        this.context.lastEntities = message.entities;
      }
    }
  }

  /**
   * Obtiene el historial completo de mensajes
   * 
   * @returns Array de mensajes
   */
  public getHistory(): Message[] {
    return [...this.context.history];
  }

  /**
   * Obtiene los últimos N mensajes
   * 
   * @param count - Número de mensajes a obtener
   * @returns Array de últimos mensajes
   */
  public getLastMessages(count: number): Message[] {
    return this.context.history.slice(-count);
  }

  /**
   * Obtiene el último mensaje del usuario
   * 
   * @returns Último mensaje del usuario o undefined
   */
  public getLastUserMessage(): Message | undefined {
    for (let i = this.context.history.length - 1; i >= 0; i--) {
      if (this.context.history[i].type === 'user') {
        return this.context.history[i];
      }
    }
    return undefined;
  }

  /**
   * Obtiene el último mensaje del bot
   * 
   * @returns Último mensaje del bot o undefined
   */
  public getLastBotMessage(): Message | undefined {
    for (let i = this.context.history.length - 1; i >= 0; i--) {
      if (this.context.history[i].type === 'bot') {
        return this.context.history[i];
      }
    }
    return undefined;
  }

  /**
   * Limpia el historial de mensajes
   */
  public clearHistory(): void {
    this.context.history = [];
    this.context.lastIntent = undefined;
    this.context.lastEntities = undefined;
  }

  /**
   * Obtiene la página actual
   * 
   * @returns Nombre de la página actual
   */
  public getCurrentPage(): string {
    return this.context.currentPage;
  }

  /**
   * Obtiene el rol del usuario actual
   * 
   * @returns Rol del usuario
   */
  public getUserRole(): UserRole {
    return this.context.userRole;
  }

  /**
   * Obtiene la última intención reconocida
   * 
   * @returns Última intención o undefined
   */
  public getLastIntent(): Intent | undefined {
    return this.context.lastIntent;
  }

  /**
   * Obtiene las últimas entidades extraídas
   * 
   * @returns Últimas entidades o undefined
   */
  public getLastEntities(): Entity[] | undefined {
    return this.context.lastEntities;
  }

  /**
   * Obtiene el número de mensajes en el historial
   * 
   * @returns Número de mensajes
   */
  public getHistoryLength(): number {
    return this.context.history.length;
  }

  /**
   * Verifica si hay historial de conversación
   * 
   * @returns true si hay mensajes, false si está vacío
   */
  public hasHistory(): boolean {
    return this.context.history.length > 0;
  }
}

export default ContextManager;
