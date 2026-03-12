# Quick Start - Fase 3

## Inicio Rápido

### 1. Inicializar la Aplicación

```typescript
import { initializeApp } from './services/database';

// En el componente raíz
async function setupApp() {
  const result = await initializeApp((loading, message) => {
    if (loading) {
      console.log(`Cargando: ${message}`);
    } else {
      console.log('Aplicación lista');
    }
  });

  console.log(`Datos cargados desde: ${result.source}`);
}

setupApp();
```

### 2. Monitorear Conexión

```typescript
import { ConnectionManager, SyncManager } from './services/database';

const connectionManager = ConnectionManager.getInstance();
const syncManager = SyncManager.getInstance();

// Registrar callback para cambios de conexión
connectionManager.onConnectionChange((connected) => {
  if (connected) {
    console.log('✓ Conectado');
    syncManager.syncPendingChanges();
  } else {
    console.log('✗ Desconectado');
  }
});

// Iniciar sincronización periódica
syncManager.startPeriodicSync(30000);
```

### 3. Crear Músico

```typescript
import {
  DatabaseService,
  LocalStorageService,
  ConnectionManager,
} from './services/database';

const databaseService = DatabaseService.getInstance();
const localStorageService = LocalStorageService.getInstance();
const connectionManager = ConnectionManager.getInstance();

async function createMusician(data) {
  try {
    // Intentar guardar en BD con reintentos
    const musician = await connectionManager.retryWithBackoff(
      () => databaseService.createMusician(data),
      3,
      'createMusician'
    );
    
    // Guardar en localStorage
    localStorageService.saveMusician(musician);
    console.log('✓ Músico creado');
    return musician;
  } catch (error) {
    // Guardar como cambio pendiente
    const pendingChange = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'create',
      musicianId: '',
      data,
      timestamp: new Date(),
      retries: 0,
    };
    
    localStorageService.addPendingChange(pendingChange);
    console.log('✓ Guardado localmente, se sincronizará después');
    return null;
  }
}
```

### 4. Monitorear Sincronización

```typescript
import { SyncManager } from './services/database';

const syncManager = SyncManager.getInstance();

// Registrar callback para finalización de sincronización
syncManager.onSyncComplete((success, changesCount) => {
  if (success) {
    console.log(`✓ ${changesCount} cambios sincronizados`);
  } else {
    console.log('✗ Error durante sincronización');
  }
});

// Obtener estado
console.log(`Sincronizando: ${syncManager.isSyncing()}`);
console.log(`Cambios pendientes: ${syncManager.getPendingChangesCount()}`);
```

### 5. Limpiar Recursos

```typescript
import { ConnectionManager, SyncManager } from './services/database';

const connectionManager = ConnectionManager.getInstance();
const syncManager = SyncManager.getInstance();

// Cuando se cierra la aplicación
window.addEventListener('beforeunload', () => {
  syncManager.stopPeriodicSync();
  connectionManager.disconnect();
  syncManager.destroy();
  connectionManager.destroy();
});
```

## Casos de Uso Comunes

### Caso 1: Aplicación Offline-First

```typescript
// 1. Inicializar
await initializeApp();

// 2. Monitorear conexión
connectionManager.onConnectionChange((connected) => {
  if (connected) syncManager.syncPendingChanges();
});

// 3. Crear/actualizar/eliminar (funciona offline)
await createMusician(data);

// 4. Sincronización automática cuando hay conexión
```

### Caso 2: Resolver Conflictos

```typescript
const syncManager = SyncManager.getInstance();

const local = { id: '1', nombre: 'Local', fechaActualizacion: new Date() };
const remote = { id: '1', nombre: 'Remote', fechaActualizacion: new Date(Date.now() - 1000) };

const resolved = syncManager.resolveConflict(local, remote);
console.log(resolved.nombre); // 'Local' (más reciente)
```

### Caso 3: Sincronización Manual

```typescript
const syncManager = SyncManager.getInstance();

// Sincronizar manualmente
await syncManager.syncPendingChanges();

// Obtener cantidad de cambios pendientes
const pendingCount = syncManager.getPendingChangesCount();
console.log(`${pendingCount} cambios pendientes`);
```

### Caso 4: Manejo de Errores

```typescript
import { ErrorHandler } from './services/database';

const errorHandler = ErrorHandler.getInstance();

// Registrar callback para errores
errorHandler.onError((notification) => {
  console.log(`[${notification.type}] ${notification.message}`);
  
  if (notification.type === 'error') {
    showErrorNotification(notification.message);
  }
});

// Obtener estadísticas
const stats = errorHandler.getErrorStats();
console.log(`Errores: ${stats.errors}, Advertencias: ${stats.warnings}`);
```

## Flujo Típico de Aplicación

```typescript
// 1. Inicializar app
const initResult = await initializeApp((loading) => {
  if (loading) showSpinner();
  else hideSpinner();
});

// 2. Configurar monitoreo
const cm = ConnectionManager.getInstance();
const sm = SyncManager.getInstance();

cm.onConnectionChange((connected) => {
  if (connected) sm.syncPendingChanges();
});

// 3. Iniciar sincronización periódica
sm.startPeriodicSync(30000);

// 4. Usar servicios normalmente
const musician = await createMusician(data);

// 5. Limpiar al cerrar
window.addEventListener('beforeunload', () => {
  sm.stopPeriodicSync();
  cm.disconnect();
  sm.destroy();
  cm.destroy();
});
```

## Métodos Principales

### ConnectionManager
```typescript
await connectionManager.connect()
connectionManager.disconnect()
connectionManager.isConnected()
connectionManager.onConnectionChange(callback)
await connectionManager.retryWithBackoff(fn, maxRetries, operationId)
```

### SyncManager
```typescript
await syncManager.syncPendingChanges()
syncManager.resolveConflict(local, remote)
syncManager.startPeriodicSync(interval)
syncManager.stopPeriodicSync()
syncManager.onSyncComplete(callback)
syncManager.isSyncing()
syncManager.getPendingChangesCount()
```

### InitialSync
```typescript
await performInitialSync(options, onLoadingChange)
await initializeApp(onLoadingChange)
```

## Propiedades Importantes

### InitialSyncResult
```typescript
{
  success: boolean,           // ¿Sincronización exitosa?
  source: 'database' | 'localStorage', // Fuente de datos
  musicians: Musician[],      // Datos sincronizados
  duration: number,           // Duración en ms
  error?: Error               // Error si ocurrió
}
```

### ErrorNotification
```typescript
{
  type: 'error' | 'warning' | 'info',
  message: string,
  details?: string,
  timestamp: Date
}
```

## Debugging

### Ver logs
```typescript
import { Logger } from './utils/logger';

// Los logs se registran automáticamente
// Buscar en console por contexto: ConnectionManager, SyncManager, InitialSync
```

### Exportar error log
```typescript
const errorHandler = ErrorHandler.getInstance();
const errorLog = errorHandler.exportErrorLog();
console.log(errorLog);
```

### Obtener estadísticas
```typescript
const syncManager = SyncManager.getInstance();
console.log(`Sincronizando: ${syncManager.isSyncing()}`);
console.log(`Cambios pendientes: ${syncManager.getPendingChangesCount()}`);
```

## Configuración

### Timeout de sincronización inicial
```typescript
await performInitialSync({ timeout: 5000 }); // 5 segundos
```

### Intervalo de sincronización periódica
```typescript
syncManager.startPeriodicSync(60000); // 60 segundos
```

### Máximo de reintentos
```typescript
// Configurado en ConnectionManager
// Primer intento: inmediato
// Segundo intento: 1 segundo
// Tercer intento: 4 segundos
```

## Troubleshooting

### Problema: Cambios no se sincronizan
**Solución**: Verificar que `startPeriodicSync()` está llamado y que hay conexión

```typescript
console.log(`Sincronizando: ${syncManager.isSyncing()}`);
console.log(`Cambios pendientes: ${syncManager.getPendingChangesCount()}`);
console.log(`Conectado: ${connectionManager.isConnected()}`);
```

### Problema: Datos no se cargan al iniciar
**Solución**: Verificar que `initializeApp()` se llama antes de usar datos

```typescript
const result = await initializeApp();
console.log(`Fuente: ${result.source}`);
console.log(`Músicos: ${result.musicians.length}`);
```

### Problema: Conflictos no se resuelven
**Solución**: Verificar que los timestamps están correctos

```typescript
const resolved = syncManager.resolveConflict(local, remote);
console.log(`Ganador: ${resolved.fechaActualizacion}`);
```

## Recursos

- [PHASE_3_README.md](./PHASE_3_README.md) - Documentación completa
- [PHASE_3_INTEGRATION_EXAMPLES.md](./PHASE_3_INTEGRATION_EXAMPLES.md) - 10 ejemplos detallados
- [PHASE_3_SUMMARY.md](./PHASE_3_SUMMARY.md) - Resumen de implementación

## Soporte

Para más información, consultar:
1. Documentación de componentes
2. Ejemplos de integración
3. Tests unitarios
4. Logs de la aplicación

