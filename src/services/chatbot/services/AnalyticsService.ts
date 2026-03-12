/**
 * AnalyticsService - Servicio de Análisis
 * 
 * Servicio que registra interacciones del chatbot para análisis y mejora continua.
 * Registra preguntas, utilidad de respuestas y preguntas no respondidas.
 * Integración con DatabaseService para persistencia de logs.
 * 
 * Requisitos: 16.1, 16.2, 16.3
 */

import type { Intent, IntentType, ChatbotStatistics } from '../types/index';
import { DatabaseService } from '../../database/DatabaseService';

/**
 * Interfaz para un registro de pregunta
 */
interface QuestionLog {
  id: string;
  question: string;
  intent: IntentType;
  userRole: string;
  timestamp: Date;
  confidence: number;
}

/**
 * Interfaz para un registro de utilidad de respuesta
 */
interface ResponseUsefulnessLog {
  messageId: string;
  useful: boolean;
  timestamp: Date;
}

/**
 * Interfaz para un registro de pregunta no respondida
 */
interface UnansweredQuestionLog {
  id: string;
  question: string;
  timestamp: Date;
}

/**
 * Servicio para registrar y analizar interacciones del chatbot
 */
export class AnalyticsService {
  /**
   * Registro de preguntas
   */
  private questionLogs: QuestionLog[] = [];

  /**
   * Registro de utilidad de respuestas
   */
  private responseUsefulnessLogs: ResponseUsefulnessLog[] = [];

  /**
   * Registro de preguntas no respondidas
   */
  private unansweredQuestionLogs: UnansweredQuestionLog[] = [];

  /**
   * Instancia del DatabaseService para persistencia
   */
  private databaseService: DatabaseService | null = null;

  /**
   * Constructor que inicializa el DatabaseService si está disponible
   */
  constructor() {
    try {
      this.databaseService = DatabaseService.getInstance();
    } catch (error) {
      // DatabaseService no disponible, usar solo memoria
      console.warn('DatabaseService not available for chatbot analytics');
    }
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registra una pregunta del usuario
   * 
   * @param question - Pregunta del usuario
   * @param intent - Intención reconocida
   * @param userRole - Rol del usuario
   */
  public logQuestion(
    question: string,
    intent: Intent,
    userRole: string
  ): void {
    const log: QuestionLog = {
      id: this.generateId(),
      question,
      intent: intent.type,
      userRole,
      timestamp: new Date(),
      confidence: intent.confidence,
    };

    this.questionLogs.push(log);
    
    // Guardar en base de datos si está disponible
    this.saveToDatabaseAsync('chatbot_questions', log);
  }

  /**
   * Registra si una respuesta fue útil
   * 
   * @param messageId - ID del mensaje
   * @param useful - true si fue útil, false si no
   */
  public logResponseUseful(messageId: string, useful: boolean): void {
    const log: ResponseUsefulnessLog = {
      messageId,
      useful,
      timestamp: new Date(),
    };

    this.responseUsefulnessLogs.push(log);
    
    // Guardar en base de datos si está disponible
    this.saveToDatabaseAsync('chatbot_response_usefulness', log);
  }

  /**
   * Registra una pregunta que no pudo ser respondida
   * 
   * @param question - Pregunta no respondida
   */
  public logUnansweredQuestion(question: string): void {
    const log: UnansweredQuestionLog = {
      id: this.generateId(),
      question,
      timestamp: new Date(),
    };

    this.unansweredQuestionLogs.push(log);
    
    // Guardar en base de datos si está disponible
    this.saveToDatabaseAsync('chatbot_unanswered_questions', log);
  }

  /**
   * Obtiene estadísticas del chatbot
   * 
   * @returns Estadísticas compiladas
   */
  public getStatistics(): ChatbotStatistics {
    const totalQuestions = this.questionLogs.length;
    const totalResponses = this.responseUsefulnessLogs.length;
    const unknownQuestions = this.unansweredQuestionLogs.length;

    // Calcular confianza promedio
    const averageConfidence =
      totalQuestions > 0
        ? this.questionLogs.reduce((sum, log) => sum + log.confidence, 0) /
          totalQuestions
        : 0;

    // Contar respuestas útiles y no útiles
    const usefulResponses = this.responseUsefulnessLogs.filter(
      (log) => log.useful
    ).length;
    const uselessResponses = this.responseUsefulnessLogs.filter(
      (log) => !log.useful
    ).length;

    // Contar intenciones principales
    const intentCounts: Record<IntentType, number> = {
      MANAGE_MUSICIANS: 0,
      AUDIO_CONFIGURATION: 0,
      WORSHIP_SERVICES: 0,
      USER_MANAGEMENT: 0,
      GENERAL_HELP: 0,
      FEATURE_EXPLANATION: 0,
      UNKNOWN: 0,
    };

    for (const log of this.questionLogs) {
      intentCounts[log.intent]++;
    }

    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({
        intent: intent as IntentType,
        count,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    // Contar entidades principales (simplificado)
    const topEntities = [
      { entity: 'MUSICIAN_NAME' as const, count: 0 },
      { entity: 'INSTRUMENT' as const, count: 0 },
      { entity: 'SERVICE_TYPE' as const, count: 0 },
      { entity: 'AUDIO_SETTING' as const, count: 0 },
      { entity: 'FEATURE_NAME' as const, count: 0 },
      { entity: 'ACTION' as const, count: 0 },
    ];

    return {
      totalQuestions,
      totalResponses,
      averageConfidence,
      unknownQuestions,
      usefulResponses,
      uselessResponses,
      topIntents,
      topEntities,
    };
  }

  /**
   * Obtiene el registro de preguntas
   * 
   * @returns Array de registros de preguntas
   */
  public getQuestionLogs(): QuestionLog[] {
    return [...this.questionLogs];
  }

  /**
   * Obtiene el registro de utilidad de respuestas
   * 
   * @returns Array de registros de utilidad
   */
  public getResponseUsefulnessLogs(): ResponseUsefulnessLog[] {
    return [...this.responseUsefulnessLogs];
  }

  /**
   * Obtiene el registro de preguntas no respondidas
   * 
   * @returns Array de registros de preguntas no respondidas
   */
  public getUnansweredQuestionLogs(): UnansweredQuestionLog[] {
    return [...this.unansweredQuestionLogs];
  }

  /**
   * Limpia todos los registros
   */
  public clearLogs(): void {
    this.questionLogs = [];
    this.responseUsefulnessLogs = [];
    this.unansweredQuestionLogs = [];
  }

  /**
   * Obtiene preguntas de un rol específico
   * 
   * @param userRole - Rol del usuario
   * @returns Array de preguntas del rol especificado
   */
  public getQuestionsByRole(userRole: string): QuestionLog[] {
    return this.questionLogs.filter((log) => log.userRole === userRole);
  }

  /**
   * Obtiene preguntas de una intención específica
   * 
   * @param intent - Tipo de intención
   * @returns Array de preguntas de la intención especificada
   */
  public getQuestionsByIntent(intent: IntentType): QuestionLog[] {
    return this.questionLogs.filter((log) => log.intent === intent);
  }

  /**
   * Obtiene preguntas dentro de un rango de tiempo
   * 
   * @param startTime - Tiempo de inicio
   * @param endTime - Tiempo de fin
   * @returns Array de preguntas dentro del rango
   */
  public getQuestionsByTimeRange(startTime: Date, endTime: Date): QuestionLog[] {
    return this.questionLogs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Obtiene la confianza promedio de una intención
   * 
   * @param intent - Tipo de intención
   * @returns Confianza promedio
   */
  public getAverageConfidenceByIntent(intent: IntentType): number {
    const logs = this.getQuestionsByIntent(intent);
    if (logs.length === 0) {
      return 0;
    }

    return logs.reduce((sum, log) => sum + log.confidence, 0) / logs.length;
  }

  /**
   * Obtiene la tasa de utilidad de respuestas
   * 
   * @returns Porcentaje de respuestas útiles (0-100)
   */
  public getUsefulnessRate(): number {
    if (this.responseUsefulnessLogs.length === 0) {
      return 0;
    }

    const useful = this.responseUsefulnessLogs.filter(
      (log) => log.useful
    ).length;
    return (useful / this.responseUsefulnessLogs.length) * 100;
  }

  /**
   * Exporta los registros como JSON
   * 
   * @returns String JSON de los registros
   */
  public exportAsJSON(): string {
    return JSON.stringify(
      {
        questionLogs: this.questionLogs,
        responseUsefulnessLogs: this.responseUsefulnessLogs,
        unansweredQuestionLogs: this.unansweredQuestionLogs,
      },
      null,
      2
    );
  }

  /**
   * Importa registros desde JSON
   * 
   * @param json - String JSON de los registros
   * @returns true si se importó correctamente, false si hay error
   */
  public importFromJSON(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      this.questionLogs = (imported.questionLogs || []).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      this.responseUsefulnessLogs = (imported.responseUsefulnessLogs || []).map(
        (log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })
      );
      this.unansweredQuestionLogs = (imported.unansweredQuestionLogs || []).map(
        (log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Guarda un registro en la base de datos de forma asincrónica
   * No bloquea la ejecución si falla
   * 
   * @param collection - Nombre de la colección en la base de datos
   * @param _data - Datos a guardar (no utilizado actualmente)
   */
  private saveToDatabaseAsync(collection: string, _data: any): void {
    if (!this.databaseService || !this.databaseService.isConnected()) {
      return; // Silenciosamente ignorar si no hay conexión
    }

    // Ejecutar de forma asincrónica sin bloquear
    Promise.resolve().then(() => {
      try {
        // TODO: Implementar guardado en base de datos
        // Cuando DatabaseService tenga métodos para guardar logs
        // this.databaseService?.saveLog(collection, data);
      } catch (error) {
        console.warn(`Failed to save chatbot log to database: ${collection}`, error);
      }
    });
  }
}

export default AnalyticsService;
