# Fase 3: Gestión de Conexión y Sincronización

## Descripción General

La Fase 3 implementa gestión robusta de conexión a la base de datos y sincronización automática entre la base de datos y localStorage. Incluye tres componentes principales:

1. **ConnectionManager** - Gestión de conexión con detección de cambios de conectividad
2. **SyncManager** - Sincronización de cambios pendientes con resolución de conflictos
3. **InitialSync** - Sincronización inicial al iniciar la aplicación

## Componentes

### 1. ConnectionManager

Gestor de conexión responsable de detectar cambios de conectividad y reintentar operaciones con backoff exponencial.

#### Métodos Principales

```typescript
// Conectar a la base de datos
async connect(): Promise<void>

// Desconectar de la base de datos
disconnect(): void

// Verificar si está conectado
isConnected(): boolean

// Registrar callback para cambios de conexión
onConnectionChange(callback: (connected: boolean) => void): void

// Desregistrar callback
offConnectionChange(callback: (connected: boolean) => void): void

// Reintentar operación con backoff exponencial
async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  operationId?: string
): Promise<T>

// Limpiar recursos
destroy(): void
```

#### Estrategia de Reintentos

- **Primer intento**: Inmediato
- **Segundo intento**: 1 segundo de espera
- **Tercer intento**: 4 segundos de espera
- **Después**: Lanzar error (cambios se guardan en cola)

#### Detección de Conectividad

- Escucha eventos `online` y `offline` del navegador
- Verifica `navigator.onLine` para estado actual
- Notifica a todos los callbacks registrados cuando cambia el estado

#### Ejemplo de Uso

```typescript
import { ConnectionManager } from './services/database';

const connectionManager = ConnectionManager.getInstance();

// Registrar callback para cambios de conexión
connectionManager.onConnectionChange((connected) => {
  if (connected) {
    console.log('Conectado a la base de datos');
    // Sincronizar cambios pendientes
  } else {
    console.log('Desconectado de la base de datos');
    // Mostrar indicador offline
  }
});

// Conectar
await connectionManager.connect();

// Reintentar operación con backoff
try {
  const result = await connectionManager.retryWithBackoff(
    () => databaseService.getMusicians(),
    3,
    'getMusicians'
  );
} catch (error) {
  console.error('Operación falló después de reintentos');
}

// Desconectar
connectionManager.disconnect();
```

### 2. SyncManager

Gestor de sincronización responsable de sincronizar cambios pendientes y resolver conflictos.

#### Métodos Principales

```typescript
// Sincronizar todos los cambios pendientes
async syncPendingChanges(): Promise<void>

// Resolver conflicto entre versión local y remota
resolveConflict(local: Musician, remote: Musician): Musician

// Iniciar sincronización periódica
startPeriodicSync(interval?: number): void

// Detener sincronización periódica
stopPeriodicSync(): void

// Registrar callback para finalización de sincronización
onSyncComplete(callback: (success: boolean, changesCount: number) => void): void

// Desregistrar callback
offSyncComplete(callback: (success: boolean, changesCount: number) => void): void

// Verificar si está sincronizando
isSyncing(): boolean

// Obtener cantidad de cambios pendientes
getPendingChangesCount(): number

// Limpiar recursos
destroy(): void
```

#### Estrategia de Sincronización

- **Cambios Pendientes**: Se guardan en localStorage cuando la conexión falla
- **Sincronización Periódica**: Se ejecuta cada 30 segundos si hay cambios pendientes
- **Resolución de Conflictos**: Usa el timestamp más reciente (local vs remoto)
- **Reintentos**: Máximo 5 reintentos por cambio antes de descartar

#### Flujo de Sincronización

```
Cambio pendiente
    ↓
¿Conectado?
├─ No → Guardar en cola
└─ Sí → Intentar sincronizar
    ↓
¿Éxito?
├─ Sí → Remover de cola
└─ No → Incrementar reintentos
    ├─ ¿Reintentos < 5?
    │  ├─ Sí → Guardar en cola
    │  └─ No → Descartar y notificar error
```

#### Ejemplo de Uso

```typescript
import { SyncManager } from './services/database';

const syncManager = SyncManager.getInstance();

// Registrar callback para finalización de sincronización
syncManager.onSyncComplete((success, changesCount) => {
  if (success) {
    console.log(`${changesCount} cambios sincronizados exitosamente`);
  } else {
    console.log('Error durante la sincronización');
  }
});

// Iniciar sincronización periódica (cada 30 segundos)
syncManager.startPeriodicSync(30000);

// Sincronizar manualmente
await syncManager.syncPendingChanges();

// Resolver conflicto
const resolved = syncManager.resolveConflict(localMusician, remoteMusician);

// Obtener cantidad de cambios pendientes
const pendingCount = syncManager.getPendingChangesCount();
console.log(`${pendingCount} cambios pendientes`);

// Detener sincronización periódica
syncManager.stopPeriodicSync();
```

### 3. InitialSync

Función para sincronización inicial al iniciar la aplicación.

#### Funciones Principales

```typescript
// Realizar sincronización inicial
async performInitialSync(
  options?: InitialSyncOptions,
  onLoadingChange?: LoadingIndicatorCallback
): Promise<InitialSyncResult>

// Inicializar aplicación con sincronización
async initializeApp(
  onLoadingChange?: LoadingIndicatorCallback
): Promise<InitialSyncResult>
```

#### Opciones de Sincronización

```typescript
interface InitialSyncOptions {
  timeout?: number;              // Timeout en ms (default: 3000)
  showLoadingIndicator?: boolean; // Mostrar indicador de carga
}
```

#### Resultado de Sincronización

```typescript
interface InitialSyncResult {
  success: boolean;              // ¿Sincronización exitosa?
  source: 'database' | 'localStorage'; // Fuente de datos
  musicians: Musician[];         // Datos sincronizados
  duration: number;              // Duración en ms
  error?: Error;                 // Error si ocurrió
}
```

#### Estrategia de Fallback

1. **Intento 1**: Descargar de la base de datos (timeout: 3 segundos)
2. **Fallback**: Si falla, cargar desde localStorage
3. **Último Recurso**: Si localStorage está vacío, retornar array vacío

#### Ejemplo de Uso

```typescript
import { performInitialSync, initializeApp } from './services/database';

// Opción 1: Sincronización inicial simple
const result = await performInitialSync();
console.log(`Datos cargados desde: ${result.source}`);
console.log(`Músicos: ${result.musicians.length}`);

// Opción 2: Con indicador de carga
const result = await performInitialSync(
  { timeout: 3000 },
  (loading, message) => {
    if (loading) {
      showLoadingSpinner(message);
    } else {
      hideLoadingSpinner();
    }
  }
);

// Opción 3: Inicializar aplicación completa
const initResult = await initializeApp((loading, message) => {
  if (loading) {
    console.log(`Cargando: ${message}`);
  } else {
    console.log('Aplicación lista');
  }
});
```

## Integración con Servicios Existentes

### Con ConnectionManager

```typescript
import { ConnectionManager, SyncManager } from './services/database';

const connectionManager = ConnectionManager.getInstance();
const syncManager = SyncManager.getInstance();

// Sincronizar cuando se recupera la conexión
connectionManager.onConnectionChange((connected) => {
  if (connected) {
    syncManager.syncPendingChanges();
  }
});
```

### Con ErrorHandler

```typescript
import { SyncManager, ErrorHandler } from './services/database';

const syncManager = SyncManager.getInstance();
const errorHandler = ErrorHandler.getInstance();

// Registrar callback para errores
errorHandler.onError((notification) => {
  console.log(`[${notification.type}] ${notification.message}`);
});

// Sincronizar con manejo de errores
try {
  await syncManager.syncPendingChanges();
} catch (error) {
  errorHandler.handleSyncError(error as Error);
}
```

### Con DatabaseService y LocalStorageService

```typescript
import {
  DatabaseService,
  LocalStorageService,
  SyncManager,
  ConnectionManager,
} from './services/database';

const databaseService = DatabaseService.getInstance();
const localStorageService = LocalStorageService.getInstance();
const syncManager = SyncManager.getInstance();
const connectionManager = ConnectionManager.getInstance();

// Crear músico con sincronización
async function createMusician(data: MusicianData) {
  try {
    // Intentar guardar en BD
    const musician = await connectionManager.retryWithBackoff(
      () => databaseService.createMusician(data),
      3,
      'createMusician'
    );
    
    // Guardar en localStorage
    localStorageService.saveMusician(musician);
    return musician;
  } catch (error) {
    // Guardar como cambio pendiente
    const pendingChange: PendingChange = {
      id: generateId(),
      type: 'create',
      musicianId: '',
      data,
      timestamp: new Date(),
      retries: 0,
    };
    
    localStorageService.addPendingChange(pendingChange);
    throw error;
  }
}
```

## Flujos de Datos

### Flujo 1: Crear Músico (Con Conexión)

```
Usuario registra
    ↓
Validar datos
    ↓
Intentar guardar en BD (con reintentos)
    ├─ Éxito → Guardar en localStorage → Mostrar confirmación
    └─ Fallo → Guardar como cambio pendiente → Mostrar error
```

### Flujo 2: Crear Músico (Sin Conexión)

```
Usuario registra
    ↓
Validar datos
    ↓
Intentar guardar en BD
    ├─ Fallo (sin conexión) → Guardar como cambio pendiente
    └─ Guardar en localStorage
    ↓
Mostrar indicador offline
    ↓
Cuando se recupera conexión → Sincronizar automáticamente
```

### Flujo 3: Iniciar Aplicación

```
App inicia
    ↓
Mostrar indicador de carga
    ↓
Intentar descargar de BD (timeout: 3s)
    ├─ Éxito → Actualizar localStorage
    └─ Fallo → Cargar desde localStorage
    ↓
Ocultar indicador de carga
    ↓
Iniciar sincronización periódica
    ↓
Mostrar datos
```

## Consideraciones de Rendimiento

### Sincronización Inicial
- Timeout: 3 segundos máximo
- Fallback automático a localStorage
- Indicador de carga visual

### Sincronización Periódica
- Intervalo: 30 segundos
- Solo se ejecuta si hay cambios pendientes
- No bloquea la UI

### Reintentos
- Máximo 3 reintentos por operación
- Backoff exponencial: 1s, 4s
- Máximo 5 reintentos por cambio pendiente

## Logging

Todos los eventos se registran con contexto:

```
[TIMESTAMP] [NIVEL] [CONTEXTO] Mensaje
Ejemplos:
[2024-01-15 10:30:45] [INFO] [ConnectionManager] Online event detected
[2024-01-15 10:30:46] [INFO] [SyncManager] Starting sync of pending changes
[2024-01-15 10:30:47] [DEBUG] [SyncManager] Pending change synced
[2024-01-15 10:30:48] [ERROR] [InitialSync] Failed to sync from database
```

## Testing

### Tests Unitarios

```bash
# Ejecutar tests de ConnectionManager
npm test -- ConnectionManager.test.ts

# Ejecutar tests de SyncManager
npm test -- SyncManager.test.ts

# Ejecutar tests de InitialSync
npm test -- InitialSync.test.ts

# Ejecutar tests de integración
npm test -- Phase3Integration.test.ts
```

## Próximos Pasos (Fase 4)

- Integrar con sistema de registro existente
- Integrar con panel de gestión de músicos
- Actualizar flujos existentes para usar nuevos servicios
- Crear UI para indicadores de estado de conexión

## Notas Importantes

1. **Offline-First**: El sistema funciona sin conexión, guardando cambios localmente
2. **Sincronización Automática**: Se sincroniza automáticamente cuando se recupera la conexión
3. **Resolución de Conflictos**: Usa timestamp más reciente para resolver conflictos
4. **Logging Exhaustivo**: Todos los eventos se registran para debugging
5. **Singleton Pattern**: Todos los servicios usan patrón singleton para instancia única
6. **Callbacks**: Permiten que la UI se actualice en tiempo real con cambios de estado

