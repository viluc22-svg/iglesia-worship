# Guía para Desarrolladores - Integración de Base de Datos

## Tabla de Contenidos

1. [Setup del Proyecto](#setup-del-proyecto)
2. [Estructura de Directorios](#estructura-de-directorios)
3. [Configuración de Entorno](#configuración-de-entorno)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Agregar Nuevas Validaciones](#agregar-nuevas-validaciones)
6. [Extender Servicios](#extender-servicios)
7. [Testing](#testing)
8. [Debugging](#debugging)

## Setup del Proyecto

### Requisitos Previos

- Node.js 16+
- npm o yarn
- Git

### Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd iglesia-worship

# Instalar dependencias
npm install

# Instalar dependencias de testing (si no están)
npm install --save-dev vitest @vitest/ui

# Crear archivo .env.local
cp .env.example .env.local
```

### Configuración Inicial

```bash
# Compilar TypeScript
npm run build

# Ejecutar en desarrollo
npm run dev

# Ejecutar tests
npm run test
```

## Estructura de Directorios

```
iglesia-worship/
├── src/
│   ├── services/
│   │   └── database/
│   │       ├── DatabaseService.ts          # CRUD con BD
│   │       ├── LocalStorageService.ts      # Caché local
│   │       ├── ValidationService.ts        # Validación
│   │       ├── ErrorHandler.ts             # Manejo de errores
│   │       ├── ConnectionManager.ts        # Gestión de conexión
│   │       ├── SyncManager.ts              # Sincronización
│   │       ├── InitialSync.ts              # Sincronización inicial
│   │       ├── Phase4Integration.ts        # Integración
│   │       ├── index.ts                    # Exports
│   │       ├── *.test.ts                   # Tests unitarios
│   │       └── *.md                        # Documentación
│   ├── types/
│   │   ├── index.ts                        # Tipos principales
│   │   └── errors.ts                       # Tipos de errores
│   ├── utils/
│   │   └── logger.ts                       # Sistema de logging
│   └── main.ts                             # Punto de entrada
├── .env.example                            # Variables de entorno
└── package.json
```

## Configuración de Entorno

### Archivo .env.local

```bash
# Tipo de base de datos
VITE_DB_TYPE=firebase

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# O para Supabase
VITE_DB_TYPE=supabase
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Logging
VITE_LOG_LEVEL=debug
```

### Obtener Credenciales Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Crear nuevo proyecto
3. Ir a Project Settings
4. Copiar credenciales a .env.local

### Obtener Credenciales Supabase

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Crear nuevo proyecto
3. Ir a Project Settings → API
4. Copiar URL y anon key a .env.local

## Ejemplos de Uso

### Ejemplo 1: Registrar Usuario

```typescript
import { registerUserWithDB } from './services/database/Phase4Integration';

async function handleRegistration() {
  try {
    const user = await registerUserWithDB({
      email: 'musician@example.com',
      nombre: 'Juan García',
      instrumento: 'Guitarra',
      contraseña: 'password123',
    });
    
    console.log('Usuario registrado:', user);
    // Mostrar confirmación al usuario
  } catch (error) {
    console.error('Error en registro:', error);
    // Mostrar error al usuario
  }
}
```

### Ejemplo 2: Crear Músico desde Panel Admin

```typescript
import { createMusicianWithDB } from './services/database/Phase4Integration';

async function handleCreateMusician(formData) {
  try {
    const musician = await createMusicianWithDB({
      email: formData.email,
      nombre: formData.nombre,
      instrumento: formData.instrumento,
      contraseña: formData.contraseña,
    });
    
    console.log('Músico creado:', musician);
    // Actualizar lista de músicos
    await loadMusicians();
  } catch (error) {
    console.error('Error creando músico:', error);
  }
}
```

### Ejemplo 3: Actualizar Músico

```typescript
import { updateMusicianWithDB } from './services/database/Phase4Integration';

async function handleUpdateMusician(musicianId, updates) {
  try {
    const updated = await updateMusicianWithDB(musicianId, {
      nombre: updates.nombre,
      instrumento: updates.instrumento,
      email: updates.email,
    });
    
    console.log('Músico actualizado:', updated);
    // Actualizar lista
    await loadMusicians();
  } catch (error) {
    console.error('Error actualizando:', error);
  }
}
```

### Ejemplo 4: Eliminar Músico

```typescript
import { deleteMusicianWithDB } from './services/database/Phase4Integration';

async function handleDeleteMusician(musicianId) {
  // Pedir confirmación
  if (!confirm('¿Está seguro de que desea eliminar este músico?')) {
    return;
  }
  
  try {
    await deleteMusicianWithDB(musicianId);
    console.log('Músico eliminado');
    // Actualizar lista
    await loadMusicians();
  } catch (error) {
    console.error('Error eliminando:', error);
  }
}
```

### Ejemplo 5: Cargar Músicos

```typescript
import { loadMusicians } from './services/database/Phase4Integration';

async function handleLoadMusicians() {
  try {
    const musicians = await loadMusicians();
    console.log('Músicos cargados:', musicians);
    // Mostrar en UI
    renderMusiciansList(musicians);
  } catch (error) {
    console.error('Error cargando músicos:', error);
  }
}
```

### Ejemplo 6: Monitorear Conexión

```typescript
import { onConnectionChange, getConnectionStatus } from './services/database/Phase4Integration';

// Verificar estado actual
const isConnected = getConnectionStatus();
console.log('Conectado:', isConnected);

// Monitorear cambios
onConnectionChange((connected) => {
  if (connected) {
    console.log('Conexión recuperada');
    // Sincronizar cambios pendientes
  } else {
    console.log('Conexión perdida');
    // Mostrar indicador offline
  }
});
```

### Ejemplo 7: Acceder a Logs

```typescript
import { Logger } from './utils/logger';

// Obtener todos los logs
const allLogs = Logger.getLogs();

// Filtrar por nivel
const errors = Logger.getLogsByLevel('error');
const warnings = Logger.getLogsByLevel('warn');

// Filtrar por contexto
const dbLogs = Logger.getLogsByContext('DatabaseService');
const syncLogs = Logger.getLogsByContext('SyncManager');

// Exportar
const jsonLogs = Logger.exportLogs();
const csvLogs = Logger.exportLogsAsCSV();

// Limpiar
Logger.clearLogs();
```

## Agregar Nuevas Validaciones

### Paso 1: Definir Regla de Validación

```typescript
// En ValidationService.ts
private static readonly VALIDATION_RULES = {
  // ... reglas existentes
  newField: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9]+$/,
    required: true,
  },
};
```

### Paso 2: Crear Método de Validación

```typescript
// En ValidationService.ts
validateNewField(value: string): ValidationResult {
  const errors: string[] = [];
  
  if (!value) {
    errors.push('El campo es requerido');
  } else if (value.length < 3) {
    errors.push('Mínimo 3 caracteres');
  } else if (value.length > 50) {
    errors.push('Máximo 50 caracteres');
  } else if (!VALIDATION_RULES.newField.pattern.test(value)) {
    errors.push('Formato inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### Paso 3: Integrar en Validación Completa

```typescript
// En ValidationService.ts
validateMusician(data: MusicianData): ValidationResult {
  const allErrors: string[] = [];
  
  // ... validaciones existentes
  
  const newFieldResult = this.validateNewField(data.newField);
  if (!newFieldResult.isValid) {
    allErrors.push(...newFieldResult.errors);
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}
```

### Paso 4: Crear Tests

```typescript
// En ValidationService.test.ts
describe('ValidationService - New Field', () => {
  it('should validate valid new field', () => {
    const result = validation.validateNewField('validValue');
    expect(result.isValid).toBe(true);
  });
  
  it('should reject empty new field', () => {
    const result = validation.validateNewField('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El campo es requerido');
  });
  
  it('should reject too short new field', () => {
    const result = validation.validateNewField('ab');
    expect(result.isValid).toBe(false);
  });
});
```

## Extender Servicios

### Agregar Método a DatabaseService

```typescript
// En DatabaseService.ts
async getMusiciansByInstrument(instrument: string): Promise<Musician[]> {
  try {
    if (!this.isConnected()) {
      throw new ConnectionError('No hay conexión a BD');
    }
    
    // Implementar según tipo de BD
    if (this.dbType === 'firebase') {
      // Lógica Firebase
    } else if (this.dbType === 'supabase') {
      // Lógica Supabase
    }
    
    Logger.info('DatabaseService', 'Músicos obtenidos por instrumento', {
      instrument,
    });
    
    return musicians;
  } catch (error) {
    Logger.error('DatabaseService', 'Error obteniendo músicos', error);
    throw error;
  }
}
```

### Agregar Método a LocalStorageService

```typescript
// En LocalStorageService.ts
getMusiciansByInstrument(instrument: string): Musician[] {
  const musicians = this.getMusicians();
  return musicians.filter(m => m.instrumento === instrument);
}
```

### Agregar Método a SyncManager

```typescript
// En SyncManager.ts
async syncSpecificMusician(musicianId: string): Promise<void> {
  try {
    const pending = this.localStorageService
      .getPendingChanges()
      .filter(c => c.musicianId === musicianId);
    
    for (const change of pending) {
      await this.applyChange(change);
    }
    
    Logger.info('SyncManager', 'Músico sincronizado', { musicianId });
  } catch (error) {
    Logger.error('SyncManager', 'Error sincronizando', error);
    throw error;
  }
}
```

## Testing

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests específicos
npm run test -- DatabaseService.test.ts

# Ejecutar con UI
npm run test -- --ui

# Ejecutar en modo watch
npm run test -- --watch

# Ejecutar con cobertura
npm run test -- --coverage
```

### Escribir Tests Unitarios

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ValidationService } from './ValidationService';

describe('ValidationService', () => {
  let validation: ValidationService;
  
  beforeEach(() => {
    validation = ValidationService.getInstance();
  });
  
  afterEach(() => {
    // Limpiar si es necesario
  });
  
  it('should validate valid email', () => {
    const result = validation.validateEmail('user@example.com');
    expect(result.isValid).toBe(true);
  });
  
  it('should reject invalid email', () => {
    const result = validation.validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

### Escribir Tests de Integración

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Phase4Integration } from './Phase4Integration';

describe('Phase4Integration', () => {
  beforeEach(async () => {
    await Phase4Integration.initializeDatabaseServices();
  });
  
  it('should register user with validation', async () => {
    const user = await Phase4Integration.registerUserWithDB({
      email: 'test@example.com',
      nombre: 'Test User',
      instrumento: 'Guitarra',
      contraseña: 'password123',
    });
    
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

## Debugging

### Habilitar Logs Detallados

```typescript
// En main.ts
import { Logger } from './utils/logger';

// Establecer nivel de log
process.env.VITE_LOG_LEVEL = 'debug';

// Ver logs en consola
const logs = Logger.getLogs();
console.table(logs);
```

### Inspeccionar Estado de Servicios

```typescript
import { DatabaseService } from './services/database/DatabaseService';
import { LocalStorageService } from './services/database/LocalStorageService';
import { ConnectionManager } from './services/database/ConnectionManager';

// Estado de conexión
const db = DatabaseService.getInstance();
console.log('Conectado:', db.isConnected());

// Datos en caché
const localStorage = LocalStorageService.getInstance();
console.log('Músicos en caché:', localStorage.getMusicians());

// Cambios pendientes
console.log('Cambios pendientes:', localStorage.getPendingChanges());

// Estado de conexión
const connManager = ConnectionManager.getInstance();
console.log('Conexión:', connManager.isConnected());
```

### Usar DevTools de Navegador

```typescript
// En consola del navegador
// Ver todos los logs
window.__WORSHIP_LOGS__ = Logger.getLogs();

// Exportar logs
copy(Logger.exportLogs());

// Ver caché local
localStorage.getItem('worship_musicians');
localStorage.getItem('worship_pending_changes');
```

### Debugging de Sincronización

```typescript
import { SyncManager } from './services/database/SyncManager';
import { Logger } from './utils/logger';

const syncManager = SyncManager.getInstance();

// Ver cambios pendientes
const pending = LocalStorageService.getInstance().getPendingChanges();
console.log('Cambios pendientes:', pending);

// Forzar sincronización
await syncManager.syncPendingChanges();

// Ver logs de sincronización
const syncLogs = Logger.getLogsByContext('SyncManager');
console.table(syncLogs);
```

## Mejores Prácticas

### 1. Siempre Usar Try-Catch

```typescript
try {
  const result = await databaseService.createMusician(data);
} catch (error) {
  Logger.error('Context', 'Error message', error);
  // Manejar error
}
```

### 2. Validar Antes de Guardar

```typescript
const validation = ValidationService.getInstance();
const result = await validation.validateMusicianComplete(data);

if (!result.isValid) {
  throw new ValidationError('Invalid data', 'musician', result.errors);
}
```

### 3. Usar Singleton Pattern

```typescript
// Correcto
const db = DatabaseService.getInstance();

// Incorrecto
const db = new DatabaseService();
```

### 4. Registrar Eventos Importantes

```typescript
Logger.info('Context', 'Operation successful', { data });
Logger.warn('Context', 'Warning message', { data });
Logger.error('Context', 'Error occurred', error);
```

### 5. Manejar Offline Gracefully

```typescript
if (!db.isConnected()) {
  // Usar localStorage
  const cached = localStorage.getMusicians();
  // Mostrar indicador offline
}
```

## Recursos Adicionales

- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - Arquitectura técnica
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guía de deployment
- [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) - Guía de troubleshooting
- [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) - Guía de monitoreo
