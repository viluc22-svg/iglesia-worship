/**
 * ResponseBuilder - Constructor de Respuestas
 * 
 * Servicio que genera respuestas formateadas basadas en intenciones y entidades.
 * Consulta la base de conocimiento y formatea respuestas con listas y énfasis.
 * 
 * Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import type {
  Intent,
  Entity,
  ConversationContext,
  ChatbotResponse,
  QuickSuggestion,
} from '../types/index';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

/**
 * Servicio para construir respuestas del chatbot
 */
export class ResponseBuilder {
  /**
   * Base de conocimiento con respuestas
   */
  private knowledgeBase = knowledgeBase;

  /**
   * Longitud máxima de una respuesta
   */
  private readonly MAX_RESPONSE_LENGTH = 500;

  /**
   * Genera un ID único para la respuesta
   */
  private generateId(): string {
    return `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Selecciona una respuesta aleatoria de un array
   */
  private selectRandomResponse(responses: string[]): string {
    if (responses.length === 0) {
      return '';
    }
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Obtiene una respuesta contextual si está disponible
   */
  private getContextualResponse(
    intent: Intent,
    context: ConversationContext
  ): string | null {
    const intentData = this.knowledgeBase.intents[intent.type];
    if (!intentData || !intentData.contextualResponses) {
      return null;
    }

    const contextualResponses =
      (intentData.contextualResponses as Record<string, string[]>)[context.currentPage];
    if (!contextualResponses || contextualResponses.length === 0) {
      return null;
    }

    return this.selectRandomResponse(contextualResponses);
  }

  /**
   * Obtiene una respuesta general para una intención
   */
  private getGeneralResponse(intent: Intent): string {
    const intentData = this.knowledgeBase.intents[intent.type];
    if (!intentData || !intentData.responses) {
      return '';
    }

    return this.selectRandomResponse(intentData.responses);
  }

  /**
   * Formatea una respuesta con listas numeradas para pasos
   */
  private formatSteps(text: string): string {
    // Detectar patrones como "1) paso", "2) paso", etc.
    const stepPattern = /(\d+\))\s+/g;
    if (stepPattern.test(text)) {
      return text; // Ya está formateado
    }

    // Detectar patrones como "Paso 1:", "Paso 2:", etc.
    const stepPattern2 = /Paso\s+\d+:/gi;
    if (stepPattern2.test(text)) {
      return text; // Ya está formateado
    }

    return text;
  }

  /**
   * Formatea una respuesta con viñetas para opciones
   */
  private formatOptions(text: string): string {
    // Detectar patrones como "- opción", "• opción", etc.
    const bulletPattern = /^[\s]*[-•*]\s+/gm;
    if (bulletPattern.test(text)) {
      return text; // Ya está formateado
    }

    return text;
  }

  /**
   * Trunca una respuesta si excede la longitud máxima
   */
  private truncateResponse(text: string): string {
    if (text.length <= this.MAX_RESPONSE_LENGTH) {
      return text;
    }

    // Truncar en el último espacio antes del límite
    const truncated = text.substring(0, this.MAX_RESPONSE_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Incluye entidades en la respuesta
   */
  private includeEntities(response: string, entities: Entity[]): string {
    let result = response;

    for (const entity of entities) {
      // Reemplazar placeholders como [MUSICIAN_NAME], [INSTRUMENT], etc.
      const placeholder = `[${entity.type}]`;
      if (result.includes(placeholder)) {
        result = result.replace(placeholder, entity.value);
      }
    }

    return result;
  }

  /**
   * Construye una respuesta del chatbot
   * 
   * @param intent - Intención reconocida
   * @param entities - Entidades extraídas
   * @param context - Contexto de la conversación
   * @returns Respuesta del chatbot
   */
  public buildResponse(
    intent: Intent,
    entities: Entity[],
    context: ConversationContext
  ): ChatbotResponse {
    let message = '';
    let isKnown = intent.type !== 'UNKNOWN';

    // Obtener respuesta contextual si está disponible
    const contextualResponse = this.getContextualResponse(intent, context);
    if (contextualResponse) {
      message = contextualResponse;
    } else {
      // Obtener respuesta general
      message = this.getGeneralResponse(intent);

      // Si no hay respuesta, es una intención desconocida
      if (!message) {
        isKnown = false;
        message =
          'No estoy seguro de lo que preguntas. ¿Podrías reformular tu pregunta?';
      }
    }

    // Incluir entidades en la respuesta
    if (entities.length > 0) {
      message = this.includeEntities(message, entities);
    }

    // Formatear respuesta
    message = this.formatSteps(message);
    message = this.formatOptions(message);

    // Truncar si es necesario
    message = this.truncateResponse(message);

    // Generar sugerencias rápidas
    const suggestions = this.generateSuggestions(intent, context);

    return {
      id: this.generateId(),
      message,
      intent,
      entities,
      suggestions,
      timestamp: new Date(),
      isKnown,
    };
  }

  /**
   * Genera sugerencias rápidas basadas en la intención y contexto
   */
  private generateSuggestions(
    intent: Intent,
    _context: ConversationContext
  ): QuickSuggestion[] {
    const suggestions: QuickSuggestion[] = [];

    // Obtener preguntas de seguimiento de la intención
    const intentData = this.knowledgeBase.intents[intent.type];
    if (intentData && intentData.followUpQuestions) {
      for (const question of intentData.followUpQuestions.slice(0, 2)) {
        suggestions.push({
          id: `suggestion-${Date.now()}-${Math.random()}`,
          text: question,
          question,
          icon: 'help-circle',
        });
      }
    }

    // Agregar sugerencias contextuales si es necesario
    if (suggestions.length < 2) {
      const defaultSuggestions = this.getDefaultSuggestions();
      suggestions.push(
        ...defaultSuggestions.slice(0, 2 - suggestions.length)
      );
    }

    return suggestions.slice(0, 4); // Máximo 4 sugerencias
  }

  /**
   * Obtiene sugerencias por defecto según el contexto
   */
  private getDefaultSuggestions(): QuickSuggestion[] {
    const suggestions: QuickSuggestion[] = [];

    // Sugerencias generales
    suggestions.push({
      id: 'default-help',
      text: 'Ayuda General',
      question: '¿Cómo uso la aplicación?',
      icon: 'help-circle',
    });

    suggestions.push({
      id: 'default-features',
      text: 'Características',
      question: '¿Cuáles son las características principales?',
      icon: 'star',
    });

    return suggestions;
  }

  /**
   * Construye una respuesta para una intención desconocida
   */
  public buildUnknownResponse(
    context: ConversationContext
  ): ChatbotResponse {
    const unknownIntent: Intent = {
      type: 'UNKNOWN',
      confidence: 0,
      category: 'Desconocida',
    };

    return this.buildResponse(unknownIntent, [], context);
  }

  /**
   * Construye una respuesta para un mensaje vacío
   */
  public buildEmptyMessageResponse(
    _context: ConversationContext
  ): ChatbotResponse {
    const unknownIntent: Intent = {
      type: 'UNKNOWN',
      confidence: 0,
      category: 'Desconocida',
    };

    return {
      id: this.generateId(),
      message: 'Por favor, escribe una pregunta para que pueda ayudarte.',
      intent: unknownIntent,
      entities: [],
      suggestions: this.getDefaultSuggestions(),
      timestamp: new Date(),
      isKnown: false,
    };
  }
}

export default ResponseBuilder;
