# Chatbot Worship - Ejemplos de Código e Integración

## Tabla de Contenidos

1. [Integración Básica](#integración-básica)
2. [Integración en Nuevas Páginas](#integración-en-nuevas-páginas)
3. [Agregar Nuevas Intenciones](#agregar-nuevas-intenciones)
4. [Agregar Nuevas Entidades](#agregar-nuevas-entidades)
5. [Personalizar Respuestas](#personalizar-respuestas)
6. [Uso Avanzado](#uso-avanzado)
7. [Ejemplos Completos](#ejemplos-completos)

---

## Integración Básica

### Importar el Chatbot en tu Aplicación

El chatbot ya está integrado en la aplicación principal. Si necesitas usarlo en un nuevo proyecto:

```typescript
// src/App.tsx
import React from 'react';
import { ChatbotWidget } from './services/chatbot/components/ChatbotWidget';
import { ChatbotProvider } from './services/chatbot/store/chatbotStore';

function App() {
  return (
    <ChatbotProvider>
      <div className="app">
        {/* Tu contenido aquí */}
        <ChatbotWidget />
      </div>
    </ChatbotProvider>
  );
}

export default App;
```

### Usar el Store del Chatbot

```typescript
import { useChatbotStore } from './services/chatbot/store/chatbotStore';

function MyComponent() {
  const { isOpen, messages, addMessage } = useChatbotStore();

  const handleOpenChat = () => {
    // Abrir el chatbot
    useChatbotStore.setState({ isOpen: true });
  };

  return (
    <div>
      <button onClick={handleOpenChat}>Abrir Chat</button>
      <p>Mensajes: {messages.length}</p>
    </div>
  );
}
```

---

## Integración en Nuevas Páginas

### Detectar Cambio de Página

El chatbot detecta automáticamente cambios de página mediante el hook `usePageContext`:

```typescript
// src/services/chatbot/hooks/usePageContext.ts
import { useEffect } from 'react';
import { useContextManager } from '../services/ContextManager';

export function usePageContext() {
  const contextManager = useContextManager();

  useEffect(() => {
    const handleHashChange = () => {
      const page = window.location.hash.slice(1) || 'home';
      contextManager.updatePageContext(page);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Llamar al cargar

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [contextManager]);
}
```

### Usar en tu Página

```typescript
// src/pages/MyPage.tsx
import { usePageContext } from '../services/chatbot/hooks/usePageContext';

function MyPage() {
  usePageContext(); // Detecta automáticamente que estamos en esta página

  return (
    <div>
      <h1>Mi Página</h1>
      {/* El chatbot mostrará sugerencias relevantes a esta página */}
    </div>
  );
}
```

### Mapeo de Rutas a Páginas

El mapeo de rutas se define en `usePageContext`:

```typescript
const pageMap = {
  '/musicians': 'musicians-page',
  '/audio': 'audio-settings',
  '/services': 'worship-services',
  '/admin': 'admin-panel',
  '/database': 'database-page',
  '/settings': 'settings-page',
  '/': 'home'
};
```

Para agregar una nueva página:

```typescript
const pageMap = {
  // ... páginas existentes
  '/my-new-page': 'my-new-page-name'
};
```

---

## Agregar Nuevas Intenciones

### Paso 1: Definir la Intención en los Tipos

```typescript
// src/services/chatbot/types/index.ts
export type IntentType = 
  | 'MANAGE_MUSICIANS'
  | 'AUDIO_CONFIGURATION'
  | 'WORSHIP_SERVICES'
  | 'USER_MANAGEMENT'
  | 'GENERAL_HELP'
  | 'FEATURE_EXPLANATION'
  | 'MY_NEW_INTENT'  // Nueva intención
  | 'UNKNOWN';
```

### Paso 2: Agregar Patrones a la Base de Conocimiento

```json
// src/services/chatbot/knowledge-base/knowledge-base.json
{
  "intents": {
    "MY_NEW_INTENT": {
      "patterns": [
        "cómo.*hacer.*algo",
        "¿cómo.*algo.*?",
        "ayuda.*con.*algo",
        "necesito.*ayuda.*algo"
      ],
      "responses": [
        "Para hacer algo, sigue estos pasos: 1. Paso 1, 2. Paso 2, 3. Paso 3",
        "Puedes hacer algo desde la sección de Algo. Aquí está cómo: ..."
      ],
      "contextualResponses": {
        "my-page": [
          "Estás en la página de Algo. Aquí puedes hacer algo. Los pasos son: ..."
        ]
      },
      "followUpQuestions": [
        "¿Cómo cambio la configuración?",
        "¿Cómo guardo mis cambios?"
      ]
    }
  }
}
```

### Paso 3: Agregar Sugerencias Rápidas

```json
{
  "quickSuggestions": {
    "my-page": [
      {
        "id": "suggestion-1",
        "text": "¿Cómo hago algo?",
        "question": "¿Cómo hago algo?",
        "icon": "help"
      },
      {
        "id": "suggestion-2",
        "text": "¿Cómo cambio la configuración?",
        "question": "¿Cómo cambio la configuración?",
        "icon": "settings"
      }
    ]
  }
}
```

### Paso 4: Probar la Nueva Intención

```typescript
// src/services/chatbot/__tests__/MyNewIntent.test.ts
import { IntentRecognizer } from '../services/IntentRecognizer';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

describe('MyNewIntent', () => {
  let recognizer: IntentRecognizer;

  beforeEach(() => {
    recognizer = new IntentRecognizer(knowledgeBase);
  });

  it('should recognize MY_NEW_INTENT', () => {
    const message = '¿Cómo hago algo?';
    const intent = recognizer.recognizeIntent(message, {});
    
    expect(intent.type).toBe('MY_NEW_INTENT');
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it('should handle variations', () => {
    const variations = [
      'Necesito ayuda con algo',
      'Cómo hacer algo',
      'Ayuda con algo'
    ];

    variations.forEach(message => {
      const intent = recognizer.recognizeIntent(message, {});
      expect(intent.type).toBe('MY_NEW_INTENT');
    });
  });
});
```

---

## Agregar Nuevas Entidades

### Paso 1: Definir la Entidad en los Tipos

```typescript
// src/services/chatbot/types/index.ts
export type EntityType = 
  | 'MUSICIAN_NAME'
  | 'INSTRUMENT'
  | 'SERVICE_TYPE'
  | 'AUDIO_SETTING'
  | 'FEATURE_NAME'
  | 'ACTION'
  | 'MY_NEW_ENTITY'  // Nueva entidad
```

### Paso 2: Agregar Patrones a la Base de Conocimiento

```json
{
  "entities": {
    "MY_NEW_ENTITY": {
      "patterns": [
        "\\b(opción1|opción2|opción3)\\b",
        "tipo:\\s*(\\w+)"
      ],
      "examples": [
        "opción1",
        "opción2",
        "opción3"
      ]
    }
  }
}
```

### Paso 3: Usar la Entidad en Respuestas

```json
{
  "intents": {
    "MY_NEW_INTENT": {
      "responses": [
        "Para usar {MY_NEW_ENTITY}, sigue estos pasos: ...",
        "Seleccionaste {MY_NEW_ENTITY}. Aquí está cómo usarlo: ..."
      ]
    }
  }
}
```

### Paso 4: Probar la Nueva Entidad

```typescript
// src/services/chatbot/__tests__/MyNewEntity.test.ts
import { EntityExtractor } from '../services/EntityExtractor';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

describe('MyNewEntity', () => {
  let extractor: EntityExtractor;

  beforeEach(() => {
    extractor = new EntityExtractor(knowledgeBase);
  });

  it('should extract MY_NEW_ENTITY', () => {
    const message = 'Necesito ayuda con opción1';
    const entities = extractor.extractEntities(message);
    
    expect(entities).toContainEqual(
      expect.objectContaining({
        type: 'MY_NEW_ENTITY',
        value: 'opción1'
      })
    );
  });

  it('should handle multiple entities', () => {
    const message = 'Necesito opción1 y opción2';
    const entities = extractor.extractEntities(message);
    
    expect(entities.filter(e => e.type === 'MY_NEW_ENTITY')).toHaveLength(2);
  });
});
```

---

## Personalizar Respuestas

### Respuestas Contextuales

Las respuestas pueden variar según la página actual:

```json
{
  "intents": {
    "MANAGE_MUSICIANS": {
      "responses": [
        "Para agregar un músico, ve al panel de Gestión de Músicos..."
      ],
      "contextualResponses": {
        "musicians-page": [
          "Estás en la página de Gestión de Músicos. Aquí puedes agregar un nuevo músico haciendo clic en el botón 'Agregar Músico'..."
        ],
        "home": [
          "Para agregar un músico, primero navega a la sección de Gestión de Músicos desde el menú principal..."
        ]
      }
    }
  }
}
```

### Respuestas con Placeholders

Puedes usar placeholders que se reemplazan con entidades:

```json
{
  "responses": [
    "Para agregar a {MUSICIAN_NAME} como {INSTRUMENT}, sigue estos pasos: ...",
    "Estás agregando a {MUSICIAN_NAME}. Selecciona {INSTRUMENT} como instrumento..."
  ]
}
```

### Respuestas Formateadas

El ResponseBuilder formatea automáticamente las respuestas:

```typescript
// Listas numeradas para pasos
"1. Abre el panel de Gestión de Músicos\n2. Haz clic en 'Agregar Músico'\n3. Completa el formulario"

// Viñetas para opciones
"Puedes elegir entre:\n• Opción 1\n• Opción 2\n• Opción 3"

// Énfasis para información importante
"**Importante:** No olvides guardar los cambios"
```

### Personalizar el ResponseBuilder

```typescript
// src/services/chatbot/services/ResponseBuilder.ts
export class ResponseBuilder {
  buildResponse(intent: Intent, entities: Entity[], context: ConversationContext): ChatbotResponse {
    // Obtener respuesta base
    let response = this.getResponseFromKnowledgeBase(intent, context);

    // Reemplazar placeholders con entidades
    for (const entity of entities) {
      const placeholder = `{${entity.type}}`;
      response = response.replace(placeholder, entity.value);
    }

    // Formatear respuesta
    response = this.formatResponse(response);

    // Generar sugerencias
    const suggestions = this.generateSuggestions(intent, context);

    return {
      id: generateId(),
      message: response,
      intent,
      entities,
      suggestions,
      timestamp: new Date(),
      isKnown: true
    };
  }

  private formatResponse(text: string): string {
    // Convertir listas numeradas
    text = text.replace(/^\d+\.\s/gm, (match) => match);

    // Convertir viñetas
    text = text.replace(/^•\s/gm, (match) => match);

    // Convertir énfasis
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return text;
  }
}
```

---

## Uso Avanzado

### Acceder al ChatbotService Directamente

```typescript
import { ChatbotService } from '../services/ChatbotService';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

const chatbotService = new ChatbotService(knowledgeBase);

// Procesar un mensaje
const response = await chatbotService.processMessage('¿Cómo agrego un músico?');
console.log(response.message);

// Obtener sugerencias contextuales
const suggestions = chatbotService.getContextualSuggestions('musicians-page', 'admin');
console.log(suggestions);
```

### Acceder al ContextManager

```typescript
import { ContextManager } from '../services/ContextManager';

const contextManager = new ContextManager();

// Actualizar contexto
contextManager.updatePageContext('musicians-page');
contextManager.setUserRole('admin');

// Obtener contexto
const context = contextManager.getConversationContext();
console.log(context.currentPage); // 'musicians-page'
console.log(context.userRole); // 'admin'
```

### Acceder al PreferencesService

```typescript
import { PreferencesService } from '../services/PreferencesService';

const preferencesService = new PreferencesService();

// Guardar preferencias
preferencesService.savePreferences({
  isMinimized: false,
  position: { x: 0, y: 0 },
  theme: 'light',
  lastUpdated: new Date()
});

// Obtener preferencias
const prefs = preferencesService.getPreferences();
console.log(prefs.isMinimized); // false
```

### Acceder al AnalyticsService

```typescript
import { AnalyticsService } from '../services/AnalyticsService';

const analyticsService = new AnalyticsService();

// Registrar una pregunta
analyticsService.logQuestion('¿Cómo agrego un músico?', intent, 'admin');

// Registrar utilidad de respuesta
analyticsService.logResponseUseful('message-id-123', true);

// Registrar pregunta no respondida
analyticsService.logUnansweredQuestion('¿Cómo hago algo muy específico?');

// Obtener estadísticas
const stats = analyticsService.getStatistics();
console.log(stats.totalQuestions);
console.log(stats.unansweredQuestions);
```

### Escuchar Cambios en el Store

```typescript
import { useChatbotStore } from '../store/chatbotStore';

function MyComponent() {
  // Suscribirse a cambios
  const unsubscribe = useChatbotStore.subscribe(
    (state) => state.messages,
    (messages) => {
      console.log('Nuevos mensajes:', messages);
    }
  );

  // Limpiar suscripción
  return () => unsubscribe();
}
```

---

## Ejemplos Completos

### Ejemplo 1: Agregar una Nueva Intención Completa

**Objetivo:** Agregar soporte para preguntas sobre "Gestión de Reportes"

**Paso 1: Actualizar tipos**

```typescript
// src/services/chatbot/types/index.ts
export type IntentType = 
  | 'MANAGE_MUSICIANS'
  | 'AUDIO_CONFIGURATION'
  | 'WORSHIP_SERVICES'
  | 'USER_MANAGEMENT'
  | 'GENERAL_HELP'
  | 'FEATURE_EXPLANATION'
  | 'MANAGE_REPORTS'  // Nueva
  | 'UNKNOWN';
```

**Paso 2: Actualizar base de conocimiento**

```json
{
  "intents": {
    "MANAGE_REPORTS": {
      "patterns": [
        "cómo.*generar.*reporte",
        "cómo.*crear.*reporte",
        "reporte",
        "reportes",
        "estadísticas",
        "análisis"
      ],
      "responses": [
        "Para generar un reporte, ve a la sección de Reportes y selecciona el tipo de reporte que deseas. Luego haz clic en 'Generar Reporte'.",
        "Los reportes te permiten analizar datos de tu iglesia. Puedes generar reportes de asistencia, músicos, servicios y más."
      ],
      "contextualResponses": {
        "reports-page": [
          "Estás en la página de Reportes. Aquí puedes generar reportes personalizados. Selecciona el tipo de reporte, el rango de fechas y haz clic en 'Generar'."
        ]
      },
      "followUpQuestions": [
        "¿Cómo exporto un reporte?",
        "¿Cómo programo reportes automáticos?"
      ]
    }
  },
  "quickSuggestions": {
    "reports-page": [
      {
        "id": "report-1",
        "text": "¿Cómo genero un reporte?",
        "question": "¿Cómo genero un reporte?",
        "icon": "chart"
      },
      {
        "id": "report-2",
        "text": "¿Cómo exporto un reporte?",
        "question": "¿Cómo exporto un reporte?",
        "icon": "download"
      }
    ]
  }
}
```

**Paso 3: Crear tests**

```typescript
// src/services/chatbot/__tests__/ManageReports.test.ts
import { IntentRecognizer } from '../services/IntentRecognizer';
import knowledgeBase from '../knowledge-base/knowledge-base.json';

describe('MANAGE_REPORTS Intent', () => {
  let recognizer: IntentRecognizer;

  beforeEach(() => {
    recognizer = new IntentRecognizer(knowledgeBase);
  });

  it('should recognize MANAGE_REPORTS intent', () => {
    const message = '¿Cómo genero un reporte?';
    const intent = recognizer.recognizeIntent(message, {});
    
    expect(intent.type).toBe('MANAGE_REPORTS');
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it('should handle variations', () => {
    const variations = [
      'Cómo crear un reporte',
      'Necesito generar reportes',
      'Estadísticas',
      'Análisis'
    ];

    variations.forEach(message => {
      const intent = recognizer.recognizeIntent(message, {});
      expect(intent.type).toBe('MANAGE_REPORTS');
    });
  });
});
```

### Ejemplo 2: Agregar una Nueva Entidad

**Objetivo:** Agregar soporte para "Tipo de Reporte"

**Paso 1: Actualizar tipos**

```typescript
export type EntityType = 
  | 'MUSICIAN_NAME'
  | 'INSTRUMENT'
  | 'SERVICE_TYPE'
  | 'AUDIO_SETTING'
  | 'FEATURE_NAME'
  | 'ACTION'
  | 'REPORT_TYPE'  // Nueva
```

**Paso 2: Actualizar base de conocimiento**

```json
{
  "entities": {
    "REPORT_TYPE": {
      "patterns": [
        "\\b(asistencia|músicos|servicios|ingresos|gastos)\\b"
      ],
      "examples": [
        "asistencia",
        "músicos",
        "servicios",
        "ingresos",
        "gastos"
      ]
    }
  }
}
```

**Paso 3: Usar en respuestas**

```json
{
  "responses": [
    "Para generar un reporte de {REPORT_TYPE}, sigue estos pasos: ...",
    "El reporte de {REPORT_TYPE} te mostrará información detallada sobre {REPORT_TYPE}."
  ]
}
```

### Ejemplo 3: Integración Completa en una Nueva Página

**Objetivo:** Agregar chatbot a una nueva página de "Reportes"

**Paso 1: Crear la página**

```typescript
// src/pages/ReportsPage.tsx
import React from 'react';
import { usePageContext } from '../services/chatbot/hooks/usePageContext';

function ReportsPage() {
  usePageContext(); // Detecta automáticamente que estamos en reports-page

  return (
    <div className="reports-page">
      <h1>Reportes</h1>
      {/* Contenido de la página */}
      {/* El chatbot mostrará sugerencias relevantes a reportes */}
    </div>
  );
}

export default ReportsPage;
```

**Paso 2: Agregar ruta**

```typescript
// src/App.tsx
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... otras rutas */}
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
      <ChatbotWidget />
    </Router>
  );
}
```

**Paso 3: Actualizar mapeo de páginas**

```typescript
// src/services/chatbot/hooks/usePageContext.ts
const pageMap = {
  '/musicians': 'musicians-page',
  '/audio': 'audio-settings',
  '/services': 'worship-services',
  '/admin': 'admin-panel',
  '/database': 'database-page',
  '/reports': 'reports-page',  // Nueva
  '/': 'home'
};
```

**Paso 4: Agregar sugerencias para la página**

```json
{
  "quickSuggestions": {
    "reports-page": [
      {
        "id": "report-1",
        "text": "¿Cómo genero un reporte?",
        "question": "¿Cómo genero un reporte?",
        "icon": "chart"
      },
      {
        "id": "report-2",
        "text": "¿Cómo exporto un reporte?",
        "question": "¿Cómo exporto un reporte?",
        "icon": "download"
      }
    ]
  }
}
```

---

## Mejores Prácticas

### 1. Mantén la Base de Conocimiento Actualizada

- Revisa regularmente los logs de preguntas no respondidas
- Agrega nuevas intenciones cuando sea necesario
- Actualiza respuestas basadas en feedback de usuarios

### 2. Prueba Nuevas Intenciones

- Crea tests unitarios para nuevas intenciones
- Prueba variaciones de preguntas
- Verifica que la confianza sea > 0.5

### 3. Usa Sugerencias Rápidas Efectivamente

- Agrega sugerencias para cada página
- Mantén 2-4 sugerencias por página
- Actualiza sugerencias basadas en uso

### 4. Documenta Cambios

- Documenta nuevas intenciones en la base de conocimiento
- Actualiza esta guía con nuevos ejemplos
- Mantén un changelog de cambios

### 5. Monitorea el Rendimiento

- Revisa logs de preguntas no respondidas
- Analiza feedback de usuarios
- Mejora continuamente

---

## Conclusión

El Chatbot Worship es altamente extensible y personalizable. Puedes agregar nuevas intenciones, entidades y respuestas fácilmente siguiendo los ejemplos en esta guía.

Para más información:
- [Documentación Técnica](./TECHNICAL_DOCUMENTATION.md)
- [Guía de Uso](./USER_GUIDE.md)
- [Guía de Troubleshooting](./TROUBLESHOOTING.md)

