/**
 * EntityExtractor - Extracción de Entidades
 * 
 * Servicio responsable de extraer información específica de los mensajes del usuario.
 * Utiliza patrones regex para identificar entidades como nombres de músicos, instrumentos, etc.
 * 
 * Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import type { Entity, EntityType } from '../types/index';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

/**
 * Servicio para extraer entidades de mensajes
 */
export class EntityExtractor {
  /**
   * Base de conocimiento con patrones de entidades
   */
  private knowledgeBase = knowledgeBase;

  /**
   * Diccionario de normalizaciones de entidades
   * Mapea variaciones a formas canónicas
   */
  private normalizationMap: Record<string, string> = {
    violin: 'violín',
    guitarra: 'guitarra',
    piano: 'piano',
    bateria: 'batería',
    bajo: 'bajo',
    trompeta: 'trompeta',
    saxofon: 'saxófon',
    flauta: 'flauta',
    organo: 'órgano',
    teclado: 'teclado',
    arpa: 'arpa',
    mandolina: 'mandolina',
    ukelele: 'ukelele',
    banjo: 'banjo',
    acordeon: 'acordeón',
  };

  /**
   * Normaliza una entidad
   * Convierte variaciones a forma canónica
   */
  private normalizeEntity(value: string): string {
    const normalized = value.toLowerCase().trim();
    return this.normalizationMap[normalized] || value;
  }

  /**
   * Extrae entidades de un mensaje
   * 
   * @param message - Mensaje del usuario
   * @returns Array de entidades extraídas
   */
  public extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];
    const normalizedMessage = message.toLowerCase();

    // Iterar sobre todos los tipos de entidades
    for (const [entityTypeName, entityData] of Object.entries(
      this.knowledgeBase.entities
    )) {
      const entityType = entityTypeName as EntityType;

      // Iterar sobre todos los patrones de la entidad
      for (const pattern of entityData.patterns) {
        try {
          const regex = new RegExp(pattern, 'gi');
          let match;

          while ((match = regex.exec(normalizedMessage)) !== null) {
            const value = match[0];
            const normalizedValue = this.normalizeEntity(value);

            // Evitar duplicados
            const isDuplicate = entities.some(
              (e) =>
                e.type === entityType &&
                e.value.toLowerCase() === normalizedValue.toLowerCase()
            );

            if (!isDuplicate) {
              entities.push({
                type: entityType,
                value: normalizedValue,
                confidence: 0.9,
                position: {
                  start: match.index,
                  end: match.index + match[0].length,
                },
              });
            }
          }
        } catch {
          // Ignorar errores en regex
          continue;
        }
      }
    }

    // Ordenar por posición en el mensaje
    entities.sort((a, b) => a.position.start - b.position.start);

    return entities;
  }

  /**
   * Extrae entidades de un tipo específico
   * 
   * @param message - Mensaje del usuario
   * @param entityType - Tipo de entidad a extraer
   * @returns Array de entidades del tipo especificado
   */
  public extractEntitiesByType(
    message: string,
    entityType: EntityType
  ): Entity[] {
    return this.extractEntities(message).filter((e) => e.type === entityType);
  }

  /**
   * Obtiene la descripción de un tipo de entidad
   */
  public getEntityTypeDescription(entityType: EntityType): string {
    const descriptions: Record<EntityType, string> = {
      MUSICIAN_NAME: 'Nombre de Músico',
      INSTRUMENT: 'Instrumento',
      SERVICE_TYPE: 'Tipo de Servicio',
      AUDIO_SETTING: 'Configuración de Audio',
      FEATURE_NAME: 'Nombre de Característica',
      ACTION: 'Acción',
    };

    return descriptions[entityType];
  }
}

export default EntityExtractor;
