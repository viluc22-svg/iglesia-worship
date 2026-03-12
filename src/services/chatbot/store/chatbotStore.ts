/**
 * Store Global del Chatbot usando Zustand
 * Gestiona el estado global del chatbot incluyendo:
 * - Estado de apertura/minimización
 * - Historial de mensajes
 * - Contexto de página y rol de usuario
 * - Sugerencias rápidas
 * - Estado de carga
 * - Persistencia en localStorage para preferencias
 * - Sincronización con PreferencesService
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatbotState,
  Message,
  QuickSuggestion,
  UserRole,
  ChatbotPreferences,
} from '../types/index';

/**
 * Clave para localStorage donde se guardan las preferencias
 */
const PREFERENCES_STORAGE_KEY = 'chatbot:preferences';

/**
 * Posición por defecto del chatbot (esquina inferior derecha)
 */
const DEFAULT_POSITION = { x: 0, y: 0 };

/**
 * Interfaz extendida del estado del chatbot con métodos adicionales
 */
interface ExtendedChatbotState extends ChatbotState {
  position: { x: number; y: number };
  theme: 'light' | 'dark';
  updatePosition: (position: { x: number; y: number }) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (isLoading: boolean) => void;
  getPreferences: () => ChatbotPreferences;
  restorePreferences: (preferences: ChatbotPreferences) => void;
}

/**
 * Store global del chatbot
 * Utiliza Zustand con middleware de persistencia para localStorage
 * Persiste preferencias del usuario: isMinimized, position, theme
 */
export const useChatbotStore = create<ExtendedChatbotState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isOpen: false,
      isMinimized: false,
      messages: [],
      currentPage: 'home',
      userRole: 'user' as UserRole,
      suggestions: [],
      isLoading: false,
      position: DEFAULT_POSITION,
      theme: 'light' as 'light' | 'dark',

      // Acciones
      /**
       * Alterna el estado de apertura del chatbot
       */
      toggleOpen: () => {
        set((state) => ({
          isOpen: !state.isOpen,
        }));
      },

      /**
       * Alterna el estado de minimización del chatbot
       */
      toggleMinimize: () => {
        set((state) => ({
          isMinimized: !state.isMinimized,
        }));
      },

      /**
       * Agrega un mensaje al historial
       * @param message - Mensaje a agregar
       */
      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      /**
       * Actualiza el contexto de página actual
       * @param page - Nombre de la página actual
       */
      updatePageContext: (page: string) => {
        set({
          currentPage: page,
        });
      },

      /**
       * Establece el rol del usuario
       * @param role - Rol del usuario (admin o user)
       */
      setUserRole: (role: UserRole) => {
        set({
          userRole: role,
        });
      },

      /**
       * Actualiza las sugerencias rápidas
       * @param suggestions - Array de sugerencias
       */
      updateSuggestions: (suggestions: QuickSuggestion[]) => {
        set({
          suggestions,
        });
      },

      /**
       * Limpia el historial de mensajes
       */
      clearMessages: () => {
        set({
          messages: [],
        });
      },

      /**
       * Actualiza la posición del chatbot en la pantalla
       * @param position - Coordenadas x, y
       */
      updatePosition: (position: { x: number; y: number }) => {
        set({
          position,
        });
      },

      /**
       * Establece el tema del chatbot
       * @param theme - Tema claro u oscuro
       */
      setTheme: (theme: 'light' | 'dark') => {
        set({
          theme,
        });
      },

      /**
       * Establece el estado de carga
       * @param isLoading - Si se está cargando
       */
      setLoading: (isLoading: boolean) => {
        set({
          isLoading,
        });
      },

      /**
       * Obtiene las preferencias actuales del usuario
       * @returns Objeto con preferencias persistidas
       */
      getPreferences: (): ChatbotPreferences => {
        const state = get();
        return {
          isMinimized: state.isMinimized,
          position: state.position,
          theme: state.theme,
          lastUpdated: new Date(),
        };
      },

      /**
       * Restaura las preferencias del usuario desde almacenamiento
       * @param preferences - Preferencias a restaurar
       */
      restorePreferences: (preferences: ChatbotPreferences) => {
        set({
          isMinimized: preferences.isMinimized,
          position: preferences.position,
          theme: preferences.theme,
        });
      },
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      partialize: (state) => ({
        isMinimized: state.isMinimized,
        position: state.position,
        theme: state.theme,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migración de versión anterior si es necesaria
          return persistedState;
        }
        return persistedState as Partial<ExtendedChatbotState>;
      },
    }
  )
);
