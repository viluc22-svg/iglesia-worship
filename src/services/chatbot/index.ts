/**
 * Punto de entrada principal del servicio Chatbot Worship
 * Exporta todos los tipos, servicios y componentes
 */

// Exportar todos los tipos
export type {
  IntentType,
  EntityType,
  UserRole,
  Message,
  Intent,
  Entity,
  ChatbotResponse,
  QuickSuggestion,
  ConversationContext,
  ChatbotPreferences,
  ChatbotState,
  ChatbotStatistics,
  KnowledgeBase,
} from './types/index';

// Exportar componentes
export { ChatbotWidget } from './components/ChatbotWidget';
export { ChatInterface } from './components/ChatInterface';
export { QuickSuggestionsPanel } from './components/QuickSuggestionsPanel';

// Exportar store
export { useChatbotStore } from './store/chatbotStore';

// Exportar servicios
export { ChatbotService } from './services/ChatbotService';
export { IntentRecognizer } from './services/IntentRecognizer';
export { EntityExtractor } from './services/EntityExtractor';
export { ContextManager } from './services/ContextManager';
export { ResponseBuilder } from './services/ResponseBuilder';
export { ConversationManager } from './services/ConversationManager';
export { PreferencesService } from './services/PreferencesService';
export { AnalyticsService } from './services/AnalyticsService';

// Exportar hooks
export { usePageContext } from './hooks/usePageContext';

