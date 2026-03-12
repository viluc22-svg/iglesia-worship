/**
 * usePageContext - Hook para Detectar Cambios de Página
 * 
 * Hook que detecta cambios de hash en la URL y actualiza el contexto del chatbot.
 * Mapea rutas a nombres de página y actualiza sugerencias automáticamente.
 * 
 * Requisitos: 4.1, 4.2, 4.3, 4.4
 */

import { useEffect } from 'react';
import { useChatbotStore } from '../store/chatbotStore';

/**
 * Mapeo de rutas hash a nombres de página
 */
const ROUTE_PAGE_MAP: Record<string, string> = {
  '/': 'home',
  '/musicians': 'musicians-page',
  '/audio': 'audio-settings',
  '/services': 'worship-services',
  '/admin': 'admin-panel',
  '/database': 'database-page',
  '/settings': 'settings-page',
  '/profile': 'profile-page',
};

/**
 * Obtiene el nombre de la página basado en el hash actual
 */
const getPageFromHash = (): string => {
  const hash = window.location.hash.replace('#', '') || '/';
  
  // Buscar coincidencia exacta
  if (ROUTE_PAGE_MAP[hash]) {
    return ROUTE_PAGE_MAP[hash];
  }

  // Buscar coincidencia parcial (ej: #/musicians/123 → musicians-page)
  for (const [route, page] of Object.entries(ROUTE_PAGE_MAP)) {
    if (hash.startsWith(route) && route !== '/') {
      return page;
    }
  }

  return 'home';
};

/**
 * Hook para detectar cambios de página y actualizar el contexto del chatbot
 * 
 * Uso:
 * ```tsx
 * function App() {
 *   usePageContext();
 *   return <YourApp />;
 * }
 * ```
 */
export const usePageContext = (): void => {
  const { updatePageContext } = useChatbotStore();

  useEffect(() => {
    // Actualizar página inicial
    const initialPage = getPageFromHash();
    updatePageContext(initialPage);

    // Escuchar cambios de hash
    const handleHashChange = () => {
      const newPage = getPageFromHash();
      updatePageContext(newPage);
    };

    window.addEventListener('hashchange', handleHashChange);

    // Limpiar listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [updatePageContext]);
};

export default usePageContext;
