# Ejemplos de Integración - Fase 3

## Ejemplo 1: Inicializar Aplicación con Sincronización

```typescript
import { initializeApp } from './services/database';

// En el componente raíz de la aplicación
async function setupApp() {
  try {
    const result = await initializeApp((loading, message) => {
      if (loading) {
        showLoadingSpinner(message);
      } else {
        hideLoadingSpinner();
      }
    });

    console.log(`Datos cargados desde: ${result.source}`);
    console.log(`Músicos: ${result.musicians.length}`);
    
    if (!result.success) {
      console.warn('Sincronización inicial falló, usando datos locales');
    }
  } catch (error) {
    console.error('Error al inicializar aplicación:', error);
  }
}

setupApp();
```

## Ejemplo 2: Monitorear Cambios de Conexión

```typescript
import { ConnectionManager, SyncManager } from './services/database';

const connectionManager = ConnectionManager.getInstance();
const syncManager = SyncManager.getInstance();

// Registrar callback para cambios de conexión
connectionManager.onConnectionChange((connected) => {
  if (connected) {
    console.log('✓ Conectado a la base de datos');
    updateConnectionIndicator('online');
    
    // Sincronizar cambios pendientes cuando se recupera la conexión
    syncManager.syncPendingChanges().catch(error => {
      console.error('Error durante sincronización:', error);
    });
  } else {
    console.log('✗ Desconectado de la base de datos');
    updateConnectionIndicator('offline');
  }
});

// Conectar
await connectionManager.connect();
```

## Ejemplo 3: Crear Músico con Manejo de Conexión

```typescript
import {
  DatabaseService,
  LocalStorageService,
  ConnectionManager,
  ValidationService,
  ErrorHandler,
} from './services/database';
import { PendingChange } from './types/musician';

const databaseService = DatabaseService.getInstance();
const localStorageService = LocalStorageService.getInstance();
const connectionManager = ConnectionManager.getInstance();
const validationService = ValidationService.getInstance();
const errorHandler = ErrorHandler.getInstance();

async function createMusician(data: MusicianData) {
  try {
    // Validar datos
    const validationResult = await validationService.validateMusicianComplete(data);
    if (!validationResult.isValid) {
      throw new Error(`Validación fallida: ${validationResult.errors.join(', ')}`);
    }

    // Intentar guardar en BD con reintentos
    let musician;
    try {
      musician = await connectionManager.retryWithBackoff(
        () => databaseService.createMusician(data),
        3,
        'createMusician'
      );
      
      // Guardar en localStorage
      localStorageService.saveMusician(musician);
      
      console.log('✓ Músico creado exitosamente');
      return musician;
    } catch (error) {
      // Si falla la conexión, guardar como cambio pendiente
      console.warn('No se pudo guardar en BD, guardando localmente');
      
      const pendingChange: PendingChange = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'create',
        musicianId: '',
        data,
        timestamp: new Date(),
        retries: 0,
      };
      
      localStorageService.addPendingChange(pendingChange);
      
      // Crear músico local
      const localMusician = {
        id: pendingChange.id,
        ...data,
        rol: data.rol || 'user',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
      };
      
      localStorageService.saveMusician(localMusician);
      
      console.log('✓ Músico guardado localmente, se sincronizará cuando haya conexión');
      return localMusician;
    }
  } catch (error) {
    errorHandler.handleError(error as Error, 'createMusician');
    throw error;
  }
}
```

## Ejemplo 4: Sincronización Periódica

```typescript
import { ConnectionManager, SyncManager } from './services/database';

const connectionManager = ConnectionManager.getInstance();
const syncManager = SyncManager.getInstance();

// Iniciar sincronización periódica (cada 30 segundos)
syncManager.startPeriodicSync(30000);

// Registrar callback para finalización de sincronización
syncManager.onSyncComplete((success, changesCount) => {
  if (success) {
    console.log(`✓ ${changesCount} cambios sincronizados`);
    updateUI();
  } else {
    console.log('✗ Error durante sincronización');
  }
});

// Cuando se cierra la aplicación
window.addEventListener('beforeunload', () => {
  syncManager.stopPeriodicSync();
  connectionManager.disconnect();
});
```

## Ejemplo 5: Resolver Conflictos Manualmente

```typescript
import { SyncManager } from './services/database';
import { Musician } from './types/musician';

const syncManager = SyncManager.getInstance();

async function handleConflict(localMusician: Musician, remoteMusician: Musician) {
  // Opción 1: Usar resolución automática (timestamp más reciente)
  const resolved = syncManager.resolveConflict(localMusician, remoteMusician);
  console.log('Conflicto resuelto automáticamente:', resolved);

  // Opción 2: Mostrar UI para que usuario elija
  const userChoice = await showConflictDialog(localMusician, remoteMusician);
  
  if (userChoice === 'local') {
    return localMusician;
  } else if (userChoice === 'remote') {
    return remoteMusician;
  } else {
    // Merge manual
    return {
      ...remoteMusician,
      nombre: localMusician.nombre, // Usar nombre local
    };
  }
}
```

## Ejemplo 6: Monitorear Estado de Sincronización

```typescript
import { SyncManager } from './services/database';

const syncManager = SyncManager.getInstance();

// Mostrar indicador de sincronización
function updateSyncIndicator() {
  const isSyncing = syncManager.isSyncing();
  const pendingCount = syncManager.getPendingChangesCount();

  if (isSyncing) {
    showSyncSpinner();
  } else {
    hideSyncSpinner();
  }

  if (pendingCount > 0) {
    showPendingChangesIndicator(pendingCount);
  } else {
    hidePendingChangesIndicator();
  }
}

// Actualizar indicador cada segundo
setInterval(updateSyncIndicator, 1000);
```

## Ejemplo 7: Manejo de Errores Centralizado

```typescript
import { ErrorHandler } from './services/database';

const errorHandler = ErrorHandler.getInstance();

// Registrar callback para notificaciones de error
errorHandler.onError((notification) => {
  console.log(`[${notification.type}] ${notification.message}`);
  
  if (notification.type === 'error') {
    showErrorNotification(notification.message, notification.details);
  } else if (notification.type === 'warning') {
    showWarningNotification(notification.message);
  } else {
    showInfoNotification(notification.message);
  }
});

// Obtener estadísticas de errores
const stats = errorHandler.getErrorStats();
console.log(`Total de errores: ${stats.total}`);
console.log(`Errores: ${stats.errors}, Advertencias: ${stats.warnings}`);

// Exportar log de errores para debugging
const errorLog = errorHandler.exportErrorLog();
console.log(errorLog);
```

## Ejemplo 8: Flujo Completo de Registro

```typescript
import {
  DatabaseService,
  LocalStorageService,
  ConnectionManager,
  ValidationService,
  ErrorHandler,
  SyncManager,
  initializeApp,
} from './services/database';

async function setupAndRegisterMusician() {
  try {
    // 1. Inicializar aplicación
    console.log('Inicializando aplicación...');
    const initResult = await initializeApp((loading, message) => {
      if (loading) {
        console.log(`Cargando: ${message}`);
      }
    });

    console.log(`Datos cargados desde: ${initResult.source}`);

    // 2. Configurar monitoreo de conexión
    const connectionManager = ConnectionManager.getInstance();
    const syncManager = SyncManager.getInstance();

    connectionManager.onConnectionChange((connected) => {
      console.log(connected ? 'Conectado' : 'Desconectado');
      if (connected) {
        syncManager.syncPendingChanges();
      }
    });

    // 3. Iniciar sincronización periódica
    syncManager.startPeriodicSync(30000);

    // 4. Registrar músico
    const validationService = ValidationService.getInstance();
    const databaseService = DatabaseService.getInstance();
    const localStorageService = LocalStorageService.getInstance();

    const musicianData = {
      email: 'musician@example.com',
      nombre: 'Juan García',
      instrumento: 'Guitarra',
      contraseña: 'securePassword123',
    };

    // Validar
    const validationResult = await validationService.validateMusicianComplete(musicianData);
    if (!validationResult.isValid) {
      throw new Error(`Validación fallida: ${validationResult.errors.join(', ')}`);
    }

    // Guardar
    try {
      const musician = await connectionManager.retryWithBackoff(
        () => databaseService.createMusician(musicianData),
        3,
        'createMusician'
      );
      
      localStorageService.saveMusician(musician);
      console.log('✓ Músico registrado exitosamente');
    } catch (error) {
      // Guardar como cambio pendiente
      const pendingChange = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'create' as const,
        musicianId: '',
        data: musicianData,
        timestamp: new Date(),
        retries: 0,
      };
      
      localStorageService.addPendingChange(pendingChange);
      console.log('✓ Músico guardado localmente');
    }

    // 5. Monitorear sincronización
    syncManager.onSyncComplete((success, changesCount) => {
      if (success) {
        console.log(`✓ ${changesCount} cambios sincronizados`);
      }
    });

  } catch (error) {
    console.error('Error en setup:', error);
  }
}

setupAndRegisterMusician();
```

## Ejemplo 9: Limpiar Recursos

```typescript
import { ConnectionManager, SyncManager } from './services/database';

const connectionManager = ConnectionManager.getInstance();
const syncManager = SyncManager.getInstance();

// Cuando se cierra la aplicación
window.addEventListener('beforeunload', () => {
  console.log('Limpiando recursos...');
  
  // Detener sincronización periódica
  syncManager.stopPeriodicSync();
  
  // Sincronizar cambios pendientes antes de cerrar
  syncManager.syncPendingChanges().catch(error => {
    console.warn('No se pudieron sincronizar cambios:', error);
  });
  
  // Desconectar
  connectionManager.disconnect();
  
  // Limpiar recursos
  syncManager.destroy();
  connectionManager.destroy();
  
  console.log('Recursos limpios');
});
```

## Ejemplo 10: Testing de Sincronización

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SyncManager } from './services/database';
import { LocalStorageService } from './services/database';
import { PendingChange } from './types/musician';

describe('Sincronización', () => {
  let syncManager: SyncManager;
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    syncManager = SyncManager.getInstance();
    localStorageService = LocalStorageService.getInstance();
    localStorageService.clearAll();
  });

  it('debería sincronizar cambios pendientes', async () => {
    const change: PendingChange = {
      id: '1',
      type: 'create',
      musicianId: 'test',
      data: {
        email: 'test@example.com',
        nombre: 'Test',
        instrumento: 'Guitarra',
        contraseña: 'pass',
      },
      timestamp: new Date(),
      retries: 0,
    };

    localStorageService.addPendingChange(change);

    const callback = vi.fn();
    syncManager.onSyncComplete(callback);

    await syncManager.syncPendingChanges();

    expect(callback).toHaveBeenCalled();
  });

  it('debería resolver conflictos por timestamp', () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000);

    const local = {
      id: '1',
      email: 'test@example.com',
      nombre: 'Local',
      instrumento: 'Guitarra',
      rol: 'user' as const,
      fechaRegistro: earlier,
      fechaActualizacion: now,
      contraseña: 'hash',
    };

    const remote = {
      id: '1',
      email: 'test@example.com',
      nombre: 'Remote',
      instrumento: 'Piano',
      rol: 'user' as const,
      fechaRegistro: earlier,
      fechaActualizacion: earlier,
      contraseña: 'hash',
    };

    const resolved = syncManager.resolveConflict(local, remote);

    expect(resolved.nombre).toBe('Local');
  });
});
```

## Notas Importantes

1. **Siempre limpiar recursos**: Llamar a `destroy()` cuando se cierra la aplicación
2. **Manejo de errores**: Usar `ErrorHandler` para notificaciones consistentes
3. **Validación**: Siempre validar datos antes de guardar
4. **Sincronización periódica**: Iniciar al cargar la app, detener al cerrar
5. **Offline-first**: El sistema funciona sin conexión, sincroniza cuando se recupera
6. **Logging**: Todos los eventos se registran para debugging

