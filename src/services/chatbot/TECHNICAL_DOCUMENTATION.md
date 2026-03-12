# Chatbot Worship - Documentación Técnica

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes](#componentes)
4. [Servicios](#servicios)
5. [Flujos de Datos](#flujos-de-datos)
6. [Decisiones de Diseño](#decisiones-de-diseño)
7. [Consideraciones de Rendimiento](#consideraciones-de-rendimiento)
8. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
9. [Estructura de Datos](#estructura-de-datos)
10. [Algoritmos Clave](#algoritmos-clave)

---

## Visión General

El Chatbot Worship es un asistente conversacional integrado en la aplicación Worship que proporciona ayuda contextual a usuarios (administradores y músicos) mediante procesamiento de lenguaje natural. El sistema utiliza reconocimiento de intenciones, extracción de entidades y una base de conocimiento estructurada para responder preguntas sobre gestión de músicos, configuración de audio, servicios de adoración y características generales de la aplicación.

**Características principales:**
- Interfaz conversacional intuitiva
- Reconocimiento de intenciones basado en patrones
- Extracción de entidades específicas del dominio
- Sugerencias rápidas contextuales
- Persistencia de preferencias del usuario
- Análisis de interacciones para mejora continua
- Accesibilidad WCAG AA
- Diseño responsivo (mobile, tablet, desktop)

---

## Arquitectura del Sistema

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                    Aplicación Worship                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           Capa de Presentación (UI)                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ChatbotWidget  │  ChatInterface  │  QuickSuggestions│  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Capa de Lógica de Negocio                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ChatbotService  │  IntentRecognizer               │  │  │
│  │  │  EntityExtractor │  ContextManager                 │  │  │
│  │  │  ResponseBuilder │  ConversationManager            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │      Capa de Datos y Persistencia                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  KnowledgeBase  │  ConversationStorage             │  │  │
│  │  │  PreferencesService  │  AnalyticsService           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│           ↓                                    ↓                  │
│  ┌──────────────────────┐          ┌──────────────────────────┐ │
│  │   LocalStorage       │          │  DatabaseService        │ │
│  │   (Caché Local)      │          │  (Análisis y Logs)      │ │ 
│  └──────────────────────┘          └──────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Principios Arquitectónicos

1. **Separación de Responsabilidades**: Cada servicio tiene una responsabilidad clara y bien definida
2. **Modularidad**: Componentes independientes que pueden evolucionar sin afectar otros
3. **Testabilidad**: Diseño que facilita testing unitario y de integración
4. **Escalabilidad**: Estructura que permite agregar nuevas intenciones y entidades fácilmente
5. **Accesibilidad**: Diseño inclusivo desde el inicio

---

## Componentes

### 1. ChatbotWidget

**Ubicación:** `src/services/chatbot/components/ChatbotWidget.tsx`

**Responsabilidad:** Botón flotante que abre/cierra la interfaz de chat

**Características:**
- Posicionado en esquina inferior derecha
- Icono de chat animado
- Badge con contador de mensajes no leídos
- Animación de entrada/salida suave
- Responsivo en todos los tamaños de pantalla

**Props:**
```typescript
interface ChatbotWidgetProps {
  // Sin props - utiliza estado global de Zustand
}
```

**Estado Interno:**
- `isOpen`: Booleano que indica si la interfaz está abierta
- `isMinimized`: Booleano que indica si está minimizada
- `unreadCount`: Número de mensajes no leídos

**Métodos Principales:**
- `toggleOpen()`: Abre/cierra la interfaz
- `toggleMinimize()`: Minimiza/expande la interfaz

**Estilos:**
- Ancho: 60px (botón)
- Altura: 60px (botón)
- Posición: fixed, bottom: 20px, right: 20px
- Z-index: 1000 (sobre otros elementos)

---

### 2. ChatInterface

**Ubicación:** `src/services/chatbot/components/ChatInterface.tsx`

**Responsabilidad:** Panel principal de conversación

**Características:**
- Área de historial de mensajes con scroll automático
- Campo de entrada de texto
- Botón de envío
- Indicador de carga mientras se procesa respuesta
- Diferenciación visual entre mensajes del usuario y del bot
- Título "Asistente Worship"

**Props:**
```typescript
interface ChatInterfaceProps {
  // Sin props - utiliza estado global de Zustand
}
```

**Estado Interno:**
- `messages`: Array de mensajes en la conversación
- `inputValue`: Texto actual en el campo de entrada
- `isLoading`: Booleano que indica si se está procesando una respuesta

**Métodos Principales:**
- `handleSendMessage()`: Procesa y envía un mensaje
- `handleInputChange()`: Actualiza el valor del input
- `scrollToBottom()`: Desplaza automáticamente al último mensaje

**Dimensiones:**
- Desktop: 350px de ancho, 500px de alto
- Tablet: 300px de ancho, 450px de alto
- Mobile: 100% - 20px de ancho, 60vh de alto

---

### 3. QuickSuggestionsPanel

**Ubicación:** `src/services/chatbot/components/QuickSuggestionsPanel.tsx`

**Responsabilidad:** Panel de sugerencias rápidas

**Características:**
- Muestra 2-4 botones de sugerencias
- Cada sugerencia incluye texto e icono
- Al hacer click, envía la pregunta automáticamente
- Se actualiza dinámicamente según el contexto
- Responsivo en todos los tamaños

**Props:**
```typescript
interface QuickSuggestionsPanelProps {
  suggestions: QuickSuggestion[];
  onSuggestionClick: (question: string) => void;
}
```

**Métodos Principales:**
- `handleSuggestionClick()`: Envía la pregunta de la sugerencia

**Estilos:**
- Disposición: Grid de 2 columnas en desktop, 1 columna en mobile
- Altura de botón: 40px
- Espaciado: 8px entre botones

---

## Servicios

### 1. ChatbotService (Orquestador Principal)

**Ubicación:** `src/services/chatbot/services/ChatbotService.ts`

**Responsabilidad:** Coordina todas las operaciones del chatbot

**Métodos Principales:**

```typescript
async processMessage(userMessage: string): Promise<ChatbotResponse>
```
Procesa un mensaje del usuario y retorna una respuesta completa.

**Flujo:**
1. Normalizar y tokenizar el mensaje
2. Reconocer la intención
3. Extraer entidades
4. Obtener contexto actual
5. Construir respuesta
6. Registrar en análisis
7. Generar sugerencias
8. Retornar respuesta completa

```typescript
getContextualSuggestions(currentPage: string, userRole: string): QuickSuggestion[]
```
Retorna sugerencias rápidas relevantes al contexto actual.

```typescript
getInitialSuggestions(userRole: string): QuickSuggestion[]
```
Retorna sugerencias iniciales cuando se abre el chatbot.

```typescript
clearConversation(): void
```
Limpia el historial de conversación.

---

### 2. IntentRecognizer

**Ubicación:** `src/services/chatbot/services/IntentRecognizer.ts`

**Responsabilidad:** Identifica la intención del usuario

**Intenciones Soportadas:**
- `MANAGE_MUSICIANS`: Gestión de músicos
- `AUDIO_CONFIGURATION`: Configuración de audio
- `WORSHIP_SERVICES`: Servicios de adoración
- `USER_MANAGEMENT`: Gestión de usuarios
- `GENERAL_HELP`: Ayuda general
- `FEATURE_EXPLANATION`: Explicación de características
- `UNKNOWN`: Intención desconocida

**Métodos Principales:**

```typescript
recognizeIntent(message: string, context: ConversationContext): Intent
```
Reconoce la intención del mensaje.

**Algoritmo:**
1. Normalizar mensaje (minúsculas, eliminar puntuación)
2. Tokenizar en palabras clave
3. Comparar contra patrones predefinidos
4. Calcular puntuación de confianza
5. Retornar intención con mayor confianza

```typescript
calculateIntentConfidence(message: string, intent: Intent): number
```
Calcula la confianza de una intención (0-1).

---

### 3. EntityExtractor

**Ubicación:** `src/services/chatbot/services/EntityExtractor.ts`

**Responsabilidad:** Extrae información específica de los mensajes

**Tipos de Entidades:**
- `MUSICIAN_NAME`: Nombre de músico
- `INSTRUMENT`: Instrumento musical
- `SERVICE_TYPE`: Tipo de servicio
- `AUDIO_SETTING`: Configuración de audio
- `FEATURE_NAME`: Nombre de característica
- `ACTION`: Acción a realizar

**Métodos Principales:**

```typescript
extractEntities(message: string): Entity[]
```
Extrae todas las entidades del mensaje.

**Algoritmo:**
1. Normalizar mensaje
2. Para cada tipo de entidad:
   - Aplicar patrones regex
   - Buscar en diccionarios
   - Registrar posición en mensaje original
3. Retornar array de entidades

```typescript
normalizeEntity(entity: Entity): Entity
```
Normaliza una entidad (ej: "violin" → "violín").

---

### 4. ContextManager

**Ubicación:** `src/services/chatbot/services/ContextManager.ts`

**Responsabilidad:** Mantiene el contexto de la conversación

**Métodos Principales:**

```typescript
updatePageContext(page: string): void
```
Actualiza la página actual del usuario.

```typescript
setUserRole(role: UserRole): void
```
Establece el rol del usuario (admin o user).

```typescript
getConversationContext(): ConversationContext
```
Retorna el contexto actual de la conversación.

```typescript
addMessageToHistory(message: Message): void
```
Agrega un mensaje al historial.

**Contexto Mantenido:**
- Página actual
- Rol del usuario
- Historial de mensajes
- Última intención reconocida
- Últimas entidades extraídas

---

### 5. ResponseBuilder

**Ubicación:** `src/services/chatbot/services/ResponseBuilder.ts`

**Responsabilidad:** Construye respuestas formateadas

**Métodos Principales:**

```typescript
buildResponse(intent: Intent, entities: Entity[], context: ConversationContext): ChatbotResponse
```
Construye una respuesta completa.

**Proceso:**
1. Consultar base de conocimiento
2. Seleccionar respuesta contextual si existe
3. Reemplazar placeholders con entidades
4. Formatear respuesta
5. Generar sugerencias de seguimiento
6. Retornar respuesta completa

```typescript
formatResponse(text: string, format: ResponseFormat): string
```
Formatea el texto de la respuesta.

**Formatos Soportados:**
- Listas numeradas para pasos
- Viñetas para opciones
- Énfasis para información importante
- Saltos de línea para legibilidad

---

### 6. ConversationManager

**Ubicación:** `src/services/chatbot/services/ConversationManager.ts`

**Responsabilidad:** Gestiona el flujo de conversación

**Métodos Principales:**

```typescript
addMessage(message: Message): void
```
Agrega un mensaje al historial.

```typescript
getHistory(): Message[]
```
Retorna el historial completo.

```typescript
getLastMessages(count: number): Message[]
```
Retorna los últimos N mensajes.

```typescript
clearHistory(): void
```
Limpia el historial.

**Características:**
- Mantiene orden cronológico
- Limpia automáticamente al recargar página
- Preserva durante navegación entre páginas

---

### 7. PreferencesService

**Ubicación:** `src/services/chatbot/services/PreferencesService.ts`

**Responsabilidad:** Gestiona preferencias del usuario

**Métodos Principales:**

```typescript
savePreferences(preferences: ChatbotPreferences): void
```
Guarda preferencias en localStorage.

```typescript
getPreferences(): ChatbotPreferences
```
Recupera preferencias guardadas.

```typescript
clearPreferences(): void
```
Limpia todas las preferencias.

**Preferencias Guardadas:**
- Estado minimizado/expandido
- Posición en pantalla
- Tema (claro/oscuro)
- Última actualización

**Almacenamiento:**
- Clave: `chatbot:preferences`
- Ubicación: localStorage
- Formato: JSON

---

### 8. AnalyticsService

**Ubicación:** `src/services/chatbot/services/AnalyticsService.ts`

**Responsabilidad:** Registra interacciones para análisis

**Métodos Principales:**

```typescript
logQuestion(question: string, intent: Intent, userRole: string): void
```
Registra una pregunta del usuario.

```typescript
logResponseUseful(messageId: string, useful: boolean): void
```
Registra si una respuesta fue útil.

```typescript
logUnansweredQuestion(question: string): void
```
Registra preguntas que no pudieron ser respondidas.

```typescript
getStatistics(): ChatbotStatistics
```
Retorna estadísticas de uso.

**Datos Registrados:**
- Pregunta del usuario
- Intención reconocida
- Rol del usuario
- Timestamp
- Utilidad de la respuesta
- Preguntas no respondidas

---

## Flujos de Datos

### Flujo de Procesamiento de Mensaje

```
Usuario escribe mensaje
        ↓
Usuario presiona Enter o click en Enviar
        ↓
ChatInterface.handleSendMessage()
        ↓
ChatbotService.processMessage(userMessage)
        ↓
IntentRecognizer.recognizeIntent()
        ↓
EntityExtractor.extractEntities()
        ↓
ContextManager.getConversationContext()
        ↓
ResponseBuilder.buildResponse()
        ↓
AnalyticsService.logQuestion()
        ↓
ConversationManager.addMessage()
        ↓
ChatbotStore.addMessage()
        ↓
ChatInterface re-renderiza con nueva respuesta
        ↓
QuickSuggestionsPanel se actualiza
        ↓
Scroll automático al último mensaje
```

### Flujo de Actualización de Contexto

```
Usuario navega a nueva página (cambio de hash)
        ↓
usePageContext hook detecta cambio
        ↓
ContextManager.updatePageContext()
        ↓
ChatbotStore.updatePageContext()
        ↓
ChatbotService.getContextualSuggestions()
        ↓
QuickSuggestionsPanel se actualiza
        ↓
Sugerencias relevantes a nueva página
```

### Flujo de Persistencia de Preferencias

```
Usuario abre/cierra chatbot
        ↓
ChatbotStore.toggleOpen()
        ↓
PreferencesService.savePreferences()
        ↓
localStorage.setItem('chatbot:preferences', ...)
        ↓
Usuario recarga página
        ↓
App.tsx carga preferencias
        ↓
PreferencesService.getPreferences()
        ↓
ChatbotStore restaura estado
        ↓
Chatbot abre/cierra según preferencia guardada
```

---

## Decisiones de Diseño

### 1. Reconocimiento de Intenciones Basado en Patrones

**Decisión:** Utilizar coincidencia de patrones en lugar de ML/NLP complejo

**Justificación:**
- Más predecible y controlable
- Menor overhead computacional
- Fácil de mantener y actualizar
- Suficiente para casos de uso específicos del dominio
- No requiere entrenamiento de modelos

**Alternativas Consideradas:**
- Machine Learning: Requeriría más datos y complejidad
- Regex puro: Menos flexible para variaciones
- API externa: Dependencia externa, latencia

---

### 2. Base de Conocimiento en JSON

**Decisión:** Almacenar base de conocimiento en JSON estructurado

**Justificación:**
- Fácil de actualizar sin recompilar
- Permite versionado
- Facilita análisis de datos
- Compatible con herramientas estándar
- Puede ser editado por no-técnicos

**Estructura:**
```json
{
  "intents": {
    "MANAGE_MUSICIANS": {
      "patterns": ["cómo.*agregar.*músico", ...],
      "responses": ["Para agregar un músico...", ...],
      "contextualResponses": {
        "musicians-page": ["Estás en la página de Gestión de Músicos..."]
      }
    }
  },
  "entities": {
    "MUSICIAN_NAME": {
      "patterns": ["\\b[A-Z][a-z]+\\b", ...],
      "examples": ["Juan", "María", ...]
    }
  }
}
```

---

### 3. Persistencia en LocalStorage

**Decisión:** Usar LocalStorage para preferencias y SessionStorage para historial

**Justificación:**
- No requiere backend adicional
- Rápido y accesible
- Privacidad del usuario
- Sincronización con DatabaseService para análisis

**Datos Persistidos:**
- Preferencias: LocalStorage (permanente)
- Historial: SessionStorage (sesión actual)
- Análisis: DatabaseService (para admin)

---

### 4. Sugerencias Contextuales Dinámicas

**Decisión:** Generar sugerencias basadas en página actual y rol

**Justificación:**
- Mejora experiencia del usuario
- Reduce necesidad de escribir
- Aumenta descubrimiento de características
- Fácil de implementar
- Mejora engagement

**Actualización:**
- Al abrir chatbot: sugerencias iniciales
- Al cambiar página: sugerencias contextuales
- Al enviar mensaje: sugerencias de seguimiento

---

### 5. Arquitectura Modular

**Decisión:** Separar reconocimiento, extracción, construcción de respuestas

**Justificación:**
- Facilita testing
- Permite reutilización de componentes
- Simplifica mantenimiento
- Permite evolución independiente
- Mejora legibilidad del código

**Módulos:**
- IntentRecognizer: Independiente
- EntityExtractor: Independiente
- ResponseBuilder: Depende de IntentRecognizer y EntityExtractor
- ChatbotService: Orquesta todos

---

## Consideraciones de Rendimiento

### Optimizaciones Implementadas

1. **Lazy Loading de Base de Conocimiento**
   - Se carga bajo demanda
   - Se cachea en memoria
   - Reduce tiempo de inicio

2. **Memoización de Resultados**
   - Cachea resultados de reconocimiento de intenciones
   - Evita recálculos innecesarios
   - Mejora velocidad de respuesta

3. **Debouncing de Actualizaciones**
   - Limita frecuencia de actualizaciones de sugerencias
   - Reduce re-renders innecesarios
   - Mejora fluidez de la UI

4. **Virtual Scrolling**
   - Para historial largo (>100 mensajes)
   - Solo renderiza mensajes visibles
   - Mantiene rendimiento con muchos mensajes

### Métricas de Performance

- **Tiempo de respuesta:** < 2 segundos
- **Tiempo de carga inicial:** < 500ms
- **Tamaño de bundle:** < 100KB (gzipped)
- **Memoria en uso:** < 10MB
- **FPS en scroll:** 60 FPS

### Monitoreo

```typescript
// Medir tiempo de respuesta
const startTime = performance.now();
const response = await chatbotService.processMessage(message);
const endTime = performance.now();
console.log(`Response time: ${endTime - startTime}ms`);
```

---

## Consideraciones de Seguridad

### 1. Validación de Entrada

```typescript
// Validar mensaje del usuario
if (!userMessage || userMessage.trim().length === 0) {
  return { error: 'Message cannot be empty' };
}

// Limitar longitud
if (userMessage.length > 1000) {
  return { error: 'Message too long' };
}
```

### 2. Sanitización de Datos

```typescript
// Sanitizar antes de mostrar
const sanitized = DOMPurify.sanitize(userMessage);
```

### 3. Protección de Datos Sensibles

- No guardar información sensible en localStorage
- Usar sessionStorage para datos temporales
- Limpiar historial al cerrar sesión

### 4. Control de Acceso

```typescript
// Filtrar sugerencias según rol
const suggestions = userRole === 'admin' 
  ? adminSuggestions 
  : musicianSuggestions;
```

---

## Estructura de Datos

### Message

```typescript
interface Message {
  id: string;                    // UUID único
  type: 'user' | 'bot';         // Tipo de mensaje
  content: string;               // Contenido del mensaje
  timestamp: Date;               // Cuándo se envió
  intent?: Intent;               // Intención reconocida
  entities?: Entity[];           // Entidades extraídas
  metadata?: {
    page?: string;               // Página donde se envió
    userRole?: string;           // Rol del usuario
  };
}
```

### Intent

```typescript
interface Intent {
  type: IntentType;              // Tipo de intención
  confidence: number;            // Confianza (0-1)
  category: string;              // Categoría
}

type IntentType = 
  | 'MANAGE_MUSICIANS'
  | 'AUDIO_CONFIGURATION'
  | 'WORSHIP_SERVICES'
  | 'USER_MANAGEMENT'
  | 'GENERAL_HELP'
  | 'FEATURE_EXPLANATION'
  | 'UNKNOWN';
```

### Entity

```typescript
interface Entity {
  type: EntityType;              // Tipo de entidad
  value: string;                 // Valor extraído
  confidence: number;            // Confianza (0-1)
  position: {                    // Posición en mensaje
    start: number;
    end: number;
  };
}

type EntityType = 
  | 'MUSICIAN_NAME'
  | 'INSTRUMENT'
  | 'SERVICE_TYPE'
  | 'AUDIO_SETTING'
  | 'FEATURE_NAME'
  | 'ACTION';
```

### ChatbotResponse

```typescript
interface ChatbotResponse {
  id: string;                    // UUID único
  message: string;               // Texto de respuesta
  intent: Intent;                // Intención procesada
  entities: Entity[];            // Entidades extraídas
  suggestions: QuickSuggestion[]; // Sugerencias de seguimiento
  timestamp: Date;               // Cuándo se generó
  isKnown: boolean;              // Si se pudo responder
}
```

---

## Algoritmos Clave

### Algoritmo de Reconocimiento de Intenciones

```typescript
recognizeIntent(message: string): Intent {
  // 1. Normalizar
  const normalized = message.toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .trim();
  
  // 2. Tokenizar
  const tokens = normalized.split(/\s+/);
  
  // 3. Buscar mejor coincidencia
  let bestMatch = { intent: 'UNKNOWN', confidence: 0 };
  
  for (const [intentName, patterns] of Object.entries(this.knowledgeBase.intents)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(normalized)) {
        const confidence = this.calculateConfidence(tokens, pattern);
        if (confidence > bestMatch.confidence) {
          bestMatch = { intent: intentName, confidence };
        }
      }
    }
  }
  
  return {
    type: bestMatch.intent,
    confidence: bestMatch.confidence,
    category: this.getCategory(bestMatch.intent)
  };
}
```

### Algoritmo de Extracción de Entidades

```typescript
extractEntities(message: string): Entity[] {
  const entities: Entity[] = [];
  
  for (const [entityType, patterns] of Object.entries(this.knowledgeBase.entities)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'gi');
      let match;
      
      while ((match = regex.exec(message)) !== null) {
        entities.push({
          type: entityType,
          value: match[0],
          confidence: 0.9,
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
  }
  
  return entities;
}
```

### Algoritmo de Cálculo de Confianza

```typescript
calculateConfidence(tokens: string[], pattern: string): number {
  const patternTokens = pattern.split(/\s+/);
  let matches = 0;
  
  for (const pToken of patternTokens) {
    for (const token of tokens) {
      if (token.includes(pToken) || pToken.includes(token)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / patternTokens.length;
}
```

---

## Integración con Sistemas Existentes

### Integración con Navegación

```typescript
// usePageContext hook detecta cambios de página
useEffect(() => {
  const handleHashChange = () => {
    const page = window.location.hash.slice(1);
    contextManager.updatePageContext(page);
  };
  
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);
```

### Integración con Autenticación

```typescript
// Detectar rol del usuario
const userRole = getCurrentUserRole(); // De sistema de auth
contextManager.setUserRole(userRole);
```

### Integración con DatabaseService

```typescript
// Guardar análisis en base de datos
analyticsService.logQuestion(question, intent, userRole);
// Se sincroniza con DatabaseService automáticamente
```

---

## Conclusión

El Chatbot Worship es un sistema bien arquitecturado, modular y escalable que proporciona una experiencia de usuario superior mediante asistencia contextual inteligente. Su diseño permite fácil mantenimiento, testing exhaustivo y evolución continua.

