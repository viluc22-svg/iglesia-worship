/**
 * ChatbotService - Orquestador Principal del Chatbot
 * 
 * Servicio central que coordina todas las operaciones del chatbot.
 * Orquesta reconocimiento de intenciones, extracción de entidades y construcción de respuestas.
 * 
 * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4, 5.5, 5.6
 */

import type {
  ChatbotResponse,
  Message,
  QuickSuggestion,
  ConversationContext,
} from '../types/index';
import { IntentRecognizer } from './IntentRecognizer';
import { EntityExtractor } from './EntityExtractor';
import { ContextManager } from './ContextManager';
import { ResponseBuilder } from './ResponseBuilder';
import { ConversationManager } from './ConversationManager';
import { AnalyticsService } from './AnalyticsService';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

/**
 * Servicio orquestador principal del chatbot
 */
export class ChatbotService {
  /**
   * Servicios internos
   */
  private intentRecognizer: IntentRecognizer;
  private entityExtractor: EntityExtractor;
  private contextManager: ContextManager;
  private responseBuilder: ResponseBuilder;
  private conversationManager: ConversationManager;
  private analyticsService: AnalyticsService;

  /**
   * Base de conocimiento
   */
  private knowledgeBase = knowledgeBase;

  /**
   * Constructor - Inicializa todos los servicios
   */
  constructor() {
    this.intentRecognizer = new IntentRecognizer();
    this.entityExtractor = new EntityExtractor();
    this.contextManager = new ContextManager();
    this.responseBuilder = new ResponseBuilder();
    this.conversationManager = new ConversationManager();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Genera un ID único para mensajes
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Procesa un mensaje del usuario y retorna una respuesta
   * 
   * @param userMessage - Mensaje del usuario
   * @returns Respuesta del chatbot
   */
  public async processMessage(userMessage: string): Promise<ChatbotResponse> {
    // Validar mensaje vacío
    if (!userMessage || userMessage.trim().length === 0) {
      const context = this.contextManager.getConversationContext();
      return this.responseBuilder.buildEmptyMessageResponse(context);
    }

    // Obtener contexto actual
    const context = this.contextManager.getConversationContext();

    // Crear mensaje del usuario
    const userMsg: Message = {
      id: this.generateId(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      metadata: {
        page: context.currentPage,
        userRole: context.userRole,
      },
    };

    // Reconocer intención
    const intent = this.intentRecognizer.recognizeIntent(userMessage);
    userMsg.intent = intent;

    // Extraer entidades
    const entities = this.entityExtractor.extractEntities(userMessage);
    userMsg.entities = entities;

    // Agregar mensaje del usuario al historial
    this.contextManager.addMessageToHistory(userMsg);
    this.conversationManager.addMessage(userMsg);

    // Registrar pregunta en análisis
    this.analyticsService.logQuestion(userMessage, intent, context.userRole);

    // Construir respuesta
    const response = this.responseBuilder.buildResponse(
      intent,
      entities,
      context
    );

    // Crear mensaje del bot
    const botMsg: Message = {
      id: response.id,
      type: 'bot',
      content: response.message,
      timestamp: response.timestamp,
      intent,
      entities,
      metadata: {
        page: context.currentPage,
        userRole: context.userRole,
      },
    };

    // Agregar mensaje del bot al historial
    this.contextManager.addMessageToHistory(botMsg);
    this.conversationManager.addMessage(botMsg);

    // Registrar pregunta no respondida si es necesario
    if (!response.isKnown) {
      this.analyticsService.logUnansweredQuestion(userMessage);
    }

    return response;
  }

  /**
   * Obtiene sugerencias contextuales basadas en la página y rol actual
   * 
   * @param currentPage - Página actual
   * @param userRole - Rol del usuario
   * @returns Array de sugerencias rápidas
   */
  public getContextualSuggestions(
    currentPage: string,
    userRole: string
  ): QuickSuggestion[] {
    const suggestions: QuickSuggestion[] = [];

    // Obtener sugerencias específicas de la página
    const pageSuggestions = (this.knowledgeBase.quickSuggestions as any)[
      currentPage
    ];
    if (pageSuggestions) {
      const roleSuggestions = pageSuggestions[userRole];
      if (roleSuggestions) {
        suggestions.push(...roleSuggestions);
      }
    }

    // Si no hay sugerencias específicas, usar sugerencias por defecto
    if (suggestions.length === 0) {
      const defaultSuggestions = (this.knowledgeBase.quickSuggestions as any)
        .default;
      if (defaultSuggestions) {
        const roleSuggestions = defaultSuggestions[userRole];
        if (roleSuggestions) {
          suggestions.push(...roleSuggestions);
        }
      }
    }

    // Limitar a 4 sugerencias
    return suggestions.slice(0, 4);
  }

  /**
   * Obtiene sugerencias iniciales para un rol
   * 
   * @param userRole - Rol del usuario
   * @returns Array de sugerencias rápidas iniciales
   */
  public getInitialSuggestions(userRole: string): QuickSuggestion[] {
    const defaultSuggestions = (this.knowledgeBase.quickSuggestions as any)
      .default;
    if (defaultSuggestions) {
      const roleSuggestions = defaultSuggestions[userRole];
      if (roleSuggestions) {
        return roleSuggestions.slice(0, 4);
      }
    }

    return [];
  }

  /**
   * Limpia la conversación actual
   */
  public clearConversation(): void {
    this.contextManager.clearHistory();
    this.conversationManager.clearHistory();
  }

  /**
   * Actualiza el contexto de página
   * 
   * @param page - Nombre de la página
   */
  public updatePageContext(page: string): void {
    this.contextManager.updatePageContext(page);
  }

  /**
   * Establece el rol del usuario
   * 
   * @param role - Rol del usuario
   */
  public setUserRole(role: 'admin' | 'user'): void {
    this.contextManager.setUserRole(role);
  }

  /**
   * Obtiene el contexto actual
   * 
   * @returns Contexto de la conversación
   */
  public getContext(): ConversationContext {
    return this.contextManager.getConversationContext();
  }

  /**
   * Obtiene el historial de mensajes
   * 
   * @returns Array de mensajes
   */
  public getHistory(): Message[] {
    return this.conversationManager.getHistory();
  }

  /**
   * Obtiene los últimos N mensajes
   * 
   * @param count - Número de mensajes
   * @returns Array de últimos mensajes
   */
  public getLastMessages(count: number): Message[] {
    return this.conversationManager.getLastMessages(count);
  }

  /**
   * Obtiene estadísticas del chatbot
   * 
   * @returns Estadísticas compiladas
   */
  public getStatistics() {
    return this.analyticsService.getStatistics();
  }

  /**
   * Registra si una respuesta fue útil
   * 
   * @param messageId - ID del mensaje
   * @param useful - true si fue útil, false si no
   */
  public logResponseUseful(messageId: string, useful: boolean): void {
    this.analyticsService.logResponseUseful(messageId, useful);
  }

  /**
   * Obtiene el servicio de análisis
   * 
   * @returns AnalyticsService
   */
  public getAnalyticsService(): AnalyticsService {
    return this.analyticsService;
  }

  /**
   * Obtiene el gestor de contexto
   * 
   * @returns ContextManager
   */
  public getContextManager(): ContextManager {
    return this.contextManager;
  }

  /**
   * Obtiene el gestor de conversación
   * 
   * @returns ConversationManager
   */
  public getConversationManager(): ConversationManager {
    return this.conversationManager;
  }
}

export default ChatbotService;
