# Chatbot Store - Zustand Global State Management

## Descripción

El `chatbotStore` es el centro de gestión del estado global del chatbot Worship. Utiliza Zustand como librería de state management y proporciona persistencia automática en localStorage para las preferencias del usuario.

## Instalación

Zustand ya está instalado como dependencia del proyecto:

```bash
npm install zustand
```

## Uso Básico

### Obtener el estado completo

```typescript
import { useChatbotStore } from './chatbotStore';

// En un componente React
const state = useChatbotStore();
console.log(state.isOpen, state.messages, state.currentPage);

// Fuera de React
const state = useChatbotStore.getState();
```

### Usar acciones

```typescript
import { useChatbotStore } from './chatbotStore';

const store = useChatbotStore.getState();

// Abrir/cerrar el chatbot
store.toggleOpen();

// Minimizar/expandir
store.toggleMinimize();

// Agregar un mensaje
store.addMessage({
  id: '1',
  type: 'user',
  content: 'Hola',
  timestamp: new Date(),
});

// Actualizar contexto de página
store.updatePageContext('musicians-page');

// Establecer rol del usuario
store.setUserRole('admin');

// Actualizar sugerencias
store.updateSuggestions([
  {
    id: '1',
    text: 'Agregar músico',
    question: '¿Cómo agrego un músico?',
  },
]);

// Limpiar mensajes
store.clearMessages();
```

## Estado

El store mantiene el siguiente estado:

```typescript
interface ChatbotState {
  isOpen: boolean;              // Si el chatbot está abierto
  isMinimized: boolean;         // Si el chatbot está minimizado
  messages: Message[];          // Historial de mensajes
  currentPage: string;          // Página actual del usuario
  userRole: UserRole;           // Rol del usuario (admin o user)
  suggestions: QuickSuggestion[]; // Sugerencias rápidas
  isLoading: boolean;           // Si se está cargando una respuesta
  position: { x: number; y: number }; // Posición del chatbot en pantalla
  theme: 'light' | 'dark';      // Tema del chatbot
}
```

## Persistencia

El store persiste automáticamente en localStorage:

- **Clave**: `chatbot:preferences`
- **Datos persistidos**: `isMinimized`, `position`, `theme`
- **Datos NO persistidos**: `messages`, `currentPage`, `userRole`, `suggestions`, `isLoading`

### Razón de la persistencia selectiva

- **isMinimized**: Se persiste para recordar la preferencia del usuario entre sesiones (Requisito 15.1)
- **position**: Se persiste para recordar la posición del chatbot en la pantalla (Requisito 15.2)
- **theme**: Se persiste para recordar el tema preferido del usuario
- **messages**: NO se persiste porque el historial debe limpiarse al recargar la página (requisito 1.6)
- **currentPage**: NO se persiste porque se actualiza automáticamente según la navegación
- **userRole**: NO se persiste porque se obtiene del sistema de autenticación
- **suggestions**: NO se persiste porque se generan dinámicamente según el contexto
- **isLoading**: NO se persiste porque es un estado temporal

## Acciones Disponibles

### toggleOpen()

Alterna el estado de apertura del chatbot.

```typescript
store.toggleOpen(); // false → true o true → false
```

### toggleMinimize()

Alterna el estado de minimización del chatbot.

```typescript
store.toggleMinimize(); // false → true o true → false
```

### addMessage(message: Message)

Agrega un mensaje al historial.

```typescript
store.addMessage({
  id: '1',
  type: 'user',
  content: 'Hola',
  timestamp: new Date(),
});
```

### updatePageContext(page: string)

Actualiza la página actual del usuario.

```typescript
store.updatePageContext('musicians-page');
```

### setUserRole(role: UserRole)

Establece el rol del usuario.

```typescript
store.setUserRole('admin');
```

### updateSuggestions(suggestions: QuickSuggestion[])

Actualiza las sugerencias rápidas.

```typescript
store.updateSuggestions([
  {
    id: '1',
    text: 'Agregar músico',
    question: '¿Cómo agrego un músico?',
  },
]);
```

### clearMessages()

Limpia el historial de mensajes.

```typescript
store.clearMessages();
```

### updatePosition(position: { x: number; y: number })

Actualiza la posición del chatbot en la pantalla.

```typescript
store.updatePosition({ x: 10, y: 20 });
```

### setTheme(theme: 'light' | 'dark')

Establece el tema del chatbot.

```typescript
store.setTheme('dark');
```

### setLoading(isLoading: boolean)

Establece el estado de carga.

```typescript
store.setLoading(true);
```

### getPreferences(): ChatbotPreferences

Obtiene las preferencias actuales del usuario.

```typescript
const preferences = store.getPreferences();
// {
//   isMinimized: false,
//   position: { x: 0, y: 0 },
//   theme: 'light',
//   lastUpdated: Date
// }
```

### restorePreferences(preferences: ChatbotPreferences)

Restaura las preferencias del usuario desde almacenamiento.

```typescript
store.restorePreferences({
  isMinimized: true,
  position: { x: 10, y: 20 },
  theme: 'dark',
  lastUpdated: new Date(),
});
```

## Ejemplos de Uso

### Ejemplo 1: Abrir el chatbot y agregar un mensaje

```typescript
import { useChatbotStore } from './chatbotStore';

const store = useChatbotStore.getState();

// Abrir el chatbot
store.toggleOpen();

// Agregar un mensaje del usuario
store.addMessage({
  id: '1',
  type: 'user',
  content: '¿Cómo agrego un músico?',
  timestamp: new Date(),
});

// Agregar respuesta del bot
store.addMessage({
  id: '2',
  type: 'bot',
  content: 'Para agregar un músico, ve al panel de Gestión de Músicos...',
  timestamp: new Date(),
});
```

### Ejemplo 2: Cambiar de página y actualizar sugerencias

```typescript
import { useChatbotStore } from './chatbotStore';

const store = useChatbotStore.getState();

// Usuario navega a la página de músicos
store.updatePageContext('musicians-page');

// Actualizar sugerencias según la página
store.updateSuggestions([
  {
    id: '1',
    text: 'Agregar músico',
    question: '¿Cómo agrego un músico?',
  },
  {
    id: '2',
    text: 'Editar músico',
    question: '¿Cómo edito un músico?',
  },
]);
```

### Ejemplo 3: Usar en un componente React

```typescript
import { useChatbotStore } from './chatbotStore';

function ChatbotWidget() {
  const isOpen = useChatbotStore((state) => state.isOpen);
  const isMinimized = useChatbotStore((state) => state.isMinimized);
  const messages = useChatbotStore((state) => state.messages);
  const toggleOpen = useChatbotStore((state) => state.toggleOpen);

  return (
    <div>
      {isOpen && !isMinimized && (
        <div>
          <h2>Asistente Worship</h2>
          {messages.map((msg) => (
            <div key={msg.id}>
              <strong>{msg.type === 'user' ? 'Tú' : 'Bot'}:</strong>
              {msg.content}
            </div>
          ))}
        </div>
      )}
      <button onClick={toggleOpen}>
        {isOpen ? 'Cerrar' : 'Abrir'} Chat
      </button>
    </div>
  );
}
```

### Ejemplo 4: Gestionar preferencias del usuario

```typescript
import { useChatbotStore } from './chatbotStore';

const store = useChatbotStore.getState();

// Cambiar posición del chatbot
store.updatePosition({ x: 50, y: 100 });

// Cambiar tema
store.setTheme('dark');

// Minimizar el chatbot
store.toggleMinimize();

// Obtener preferencias actuales
const preferences = store.getPreferences();
console.log(preferences);
// {
//   isMinimized: true,
//   position: { x: 50, y: 100 },
//   theme: 'dark',
//   lastUpdated: Date
// }

// Las preferencias se guardan automáticamente en localStorage
// y se restauran cuando el usuario regresa a la aplicación
```

## Testing

El store incluye una suite completa de tests en `__tests__/chatbotStore.test.ts`.

Para ejecutar los tests:

```bash
npm run test:run -- src/services/chatbot/__tests__/chatbotStore.test.ts
```

Los tests cubren:

- Estado inicial
- Todas las acciones (toggleOpen, toggleMinimize, addMessage, etc.)
- Persistencia en localStorage
- Selectores de estado
- Casos de uso complejos

## Requisitos Validados

Este store valida los siguientes requisitos:

- **1.4**: El chatbot permanece visible mientras el usuario navega entre páginas
- **1.5**: El sistema mantiene el historial de conversación durante la sesión
- **2.4**: La interfaz de chat permanece visible mientras el usuario navega
- **15.1**: El sistema recuerda si el usuario prefiere el chatbot minimizado
- **15.2**: El sistema recuerda la posición del chatbot (preparado para futuras mejoras)
- **15.3**: El sistema restaura las preferencias cuando el usuario regresa
- **15.4**: El sistema guarda las preferencias en localStorage

## Notas Importantes

1. **No usar en componentes sin React**: Si necesitas usar el store fuera de componentes React, usa `useChatbotStore.getState()` en lugar de `useChatbotStore()`.

2. **Persistencia selectiva**: Solo `isMinimized`, `position` y `theme` se persisten. El historial de mensajes se limpia al recargar la página (requisito 1.6).

3. **Sincronización**: El store se sincroniza automáticamente con localStorage gracias al middleware de persistencia de Zustand.

4. **Performance**: Zustand es muy eficiente y solo re-renderiza componentes que usan el estado que cambió.

5. **Métodos de Preferencias**: Usa `getPreferences()` para obtener las preferencias actuales y `restorePreferences()` para restaurarlas desde almacenamiento externo.

## Migración Futura

Si en el futuro necesitas:

- Persistir más datos: Actualiza la función `partialize` en el middleware
- Cambiar la clave de localStorage: Actualiza `PREFERENCES_STORAGE_KEY`
- Agregar nuevas propiedades: Actualiza la interfaz `ChatbotState` en `types/index.ts`
