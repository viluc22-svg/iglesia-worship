/**
 * IntentRecognizer - Reconocimiento de Intenciones
 * 
 * Servicio responsable de identificar la intención del usuario en sus mensajes.
 * Utiliza coincidencia de patrones contra la base de conocimiento.
 * 
 * Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { Intent, IntentType } from '../types/index';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

/**
 * Servicio para reconocer intenciones en mensajes del usuario
 */
export class IntentRecognizer {
  /**
   * Base de conocimiento con patrones de intenciones
   */
  private knowledgeBase = knowledgeBase;

  /**
   * Normaliza un mensaje para procesamiento
   * - Convierte a minúsculas
   * - Elimina puntuación
   * - Elimina espacios múltiples
   */
  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .replace(/[.,!?;:()[\]{}]/g, '') // Eliminar puntuación
      .replace(/\s+/g, ' ') // Eliminar espacios múltiples
      .trim();
  }

  /**
   * Tokeniza un mensaje en palabras
   */
  private tokenize(message: string): string[] {
    return message.split(/\s+/).filter((token) => token.length > 0);
  }

  /**
   * Calcula la similitud entre dos strings usando Levenshtein distance
   * Retorna un valor entre 0 y 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }

  /**
   * Calcula la confianza de coincidencia entre un mensaje y un patrón
   */
  private calculatePatternMatch(
    normalizedMessage: string,
    pattern: string
  ): number {
    try {
      // Crear regex del patrón
      const regex = new RegExp(pattern, 'i');
      
      // Si el patrón coincide exactamente, confianza alta
      if (regex.test(normalizedMessage)) {
        return 0.95;
      }

      // Si no coincide exactamente, calcular similitud basada en tokens
      const tokens = this.tokenize(normalizedMessage);
      const patternTokens = this.tokenize(pattern.replace(/[.*+?^${}()|[\]\\]/g, ''));
      
      let totalSimilarity = 0;
      let matches = 0;

      for (const patternToken of patternTokens) {
        for (const token of tokens) {
          const similarity = this.calculateSimilarity(token, patternToken);
          if (similarity > 0.6) {
            totalSimilarity += similarity;
            matches++;
            break;
          }
        }
      }

      if (matches === 0) {
        return 0;
      }

      // Retornar confianza basada en el porcentaje de tokens coincidentes
      const matchPercentage = matches / patternTokens.length;
      return Math.min(0.85, matchPercentage * 0.85);
    } catch {
      return 0;
    }
  }

  /**
   * Reconoce la intención de un mensaje
   * 
   * @param message - Mensaje del usuario
   * @returns Intención reconocida con confianza
   */
  public recognizeIntent(
    message: string
  ): Intent {
    if (!message || message.trim().length === 0) {
      return {
        type: 'UNKNOWN',
        confidence: 0,
        category: 'unknown',
      };
    }

    const normalizedMessage = this.normalizeMessage(message);
    let bestMatch: { intent: IntentType; confidence: number } = {
      intent: 'UNKNOWN',
      confidence: 0,
    };

    // Iterar sobre todas las intenciones en la base de conocimiento
    for (const [intentName, intentData] of Object.entries(
      this.knowledgeBase.intents
    )) {
      const intentType = intentName as IntentType;
      
      // Iterar sobre todos los patrones de la intención
      for (const pattern of intentData.patterns) {
        const confidence = this.calculatePatternMatch(
          normalizedMessage,
          pattern
        );

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: intentType,
            confidence,
          };
        }
      }
    }

    // Si la confianza es menor a 0.5, retornar UNKNOWN
    if (bestMatch.confidence < 0.5) {
      return {
        type: 'UNKNOWN',
        confidence: 0,
        category: 'unknown',
      };
    }

    return {
      type: bestMatch.intent,
      confidence: bestMatch.confidence,
      category: this.getIntentCategory(bestMatch.intent),
    };
  }

  /**
   * Obtiene la categoría de una intención
   */
  private getIntentCategory(intentType: IntentType): string {
    const categories: Record<IntentType, string> = {
      MANAGE_MUSICIANS: 'Gestión de Músicos',
      AUDIO_CONFIGURATION: 'Configuración de Audio',
      WORSHIP_SERVICES: 'Servicios de Adoración',
      USER_MANAGEMENT: 'Gestión de Usuarios',
      GENERAL_HELP: 'Ayuda General',
      FEATURE_EXPLANATION: 'Explicación de Características',
      UNKNOWN: 'Desconocida',
    };

    return categories[intentType];
  }

  /**
   * Calcula la confianza de una intención
   */
  public calculateIntentConfidence(
    _message: string,
    intent: Intent
  ): number {
    return intent.confidence;
  }
}

export default IntentRecognizer;
