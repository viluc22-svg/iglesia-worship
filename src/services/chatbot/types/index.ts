/**
 * Tipos TypeScript para el Chatbot Worship
 * Define todas las interfaces y tipos utilizados en el sistema del chatbot
 */

/**
 * Tipos de intenciones que el chatbot puede reconocer
 */
export type IntentType =
  | 'MANAGE_MUSICIANS'
  | 'AUDIO_CONFIGURATION'
  | 'WORSHIP_SERVICES'
  | 'USER_MANAGEMENT'
  | 'GENERAL_HELP'
  | 'FEATURE_EXPLANATION'
  | 'UNKNOWN';

/**
 * Tipos de entidades que el chatbot puede extraer
 */
export type EntityType =
  | 'MUSICIAN_NAME'
  | 'INSTRUMENT'
  | 'SERVICE_TYPE'
  | 'AUDIO_SETTING'
  | 'FEATURE_NAME'
  | 'ACTION';

/**
 * Roles de usuario en la aplicación
 */
export type UserRole = 'admin' | 'user';

/**
 * Interfaz para un mensaje en la conversación
 */
export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  intent?: Intent;
  entities?: Entity[];
  metadata?: {
    page?: string;
    userRole?: string;
  };
}

/**
 * Interfaz para una intención reconocida
 */
export interface Intent {
  type: IntentType;
  confidence: number;
  category: string;
}

/**
 * Interfaz para una entidad extraída
 */
export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

/**
 * Interfaz para la respuesta del chatbot
 */
export interface ChatbotResponse {
  id: string;
  message: string;
  intent: Intent;
  entities: Entity[];
  suggestions: QuickSuggestion[];
  timestamp: Date;
  isKnown: boolean;
}

/**
 * Interfaz para una sugerencia rápida
 */
export interface QuickSuggestion {
  id: string;
  text: string;
  question: string;
  context?: string;
  icon?: string;
}

/**
 * Interfaz para el contexto de la conversación
 */
export interface ConversationContext {
  currentPage: string;
  userRole: UserRole;
  history: Message[];
  lastIntent?: Intent;
  lastEntities?: Entity[];
}

/**
 * Interfaz para las preferencias del chatbot
 */
export interface ChatbotPreferences {
  isMinimized: boolean;
  position: {
    x: number;
    y: number;
  };
  theme: 'light' | 'dark';
  lastUpdated: Date;
}

/**
 * Interfaz para el estado global del chatbot
 */
export interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: Message[];
  currentPage: string;
  userRole: UserRole;
  suggestions: QuickSuggestion[];
  isLoading: boolean;

  // Actions
  toggleOpen: () => void;
  toggleMinimize: () => void;
  addMessage: (message: Message) => void;
  updatePageContext: (page: string) => void;
  setUserRole: (role: UserRole) => void;
  updateSuggestions: (suggestions: QuickSuggestion[]) => void;
  clearMessages: () => void;
}

/**
 * Interfaz para estadísticas del chatbot
 */
export interface ChatbotStatistics {
  totalQuestions: number;
  totalResponses: number;
  averageConfidence: number;
  unknownQuestions: number;
  usefulResponses: number;
  uselessResponses: number;
  topIntents: Array<{
    intent: IntentType;
    count: number;
  }>;
  topEntities: Array<{
    entity: EntityType;
    count: number;
  }>;
}

/**
 * Interfaz para la estructura de la base de conocimiento
 */
export interface KnowledgeBase {
  intents: Record<
    IntentType,
    {
      patterns: string[];
      responses: string[];
      contextualResponses?: Record<string, string[]>;
      followUpQuestions?: string[];
    }
  >;
  entities: Record<
    EntityType,
    {
      patterns: string[];
      examples: string[];
    }
  >;
  suggestions?: Record<
    string,
    {
      byRole?: Record<UserRole, QuickSuggestion[]>;
      byPage?: Record<string, QuickSuggestion[]>;
    }
  >;
}
