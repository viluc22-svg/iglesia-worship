# Fase 2: Validación y Manejo de Errores

## Descripción General

La Fase 2 implementa validación robusta de datos y manejo centralizado de errores para la integración de base de datos. Incluye tres componentes principales:

1. **ValidationService** - Validación de datos de músicos
2. **ErrorHandler** - Manejo centralizado de errores
3. **Tipos de Errores Personalizados** - Clases de error especializadas

## Componentes

### 1. ValidationService

Servicio responsable de validar todos los datos de músicos antes de guardarlos en la base de datos.

#### Métodos Principales

```typescript
// Validar email
validateEmail(email: string): ValidationResult

// Validar nombre
validateName(name: string): ValidationResult

// Validar instrumento
validateInstrument(instrument: string): ValidationResult

// Validar contraseña
validatePassword(password: string): ValidationResult

// Validar datos completos de músico
validateMusician(data: MusicianData): ValidationResult

// Validar datos completos incluyendo unicidad de email
async validateMusicianComplete(data: MusicianData): Promise<ValidationResult>

// Verificar si email es único
async isEmailUnique(email: string): Promise<boolean>

// Obtener reglas de validación
getValidationRules(): ValidationRules
```

#### Reglas de Validación

- **Email**: Debe tener formato válido (patrón: `user@domain.ext`)
- **Nombre**: Entre 2 y 100 caracteres
- **Instrumento**: Debe ser uno de: Guitarra, Piano, Bajo, Batería, Voz, Director
- **Contraseña**: Mínimo 6 caracteres
- **Email Único**: No debe existir otro músico con el mismo email
- **Rol**: Debe ser 'user' o 'admin'

#### Ejemplo de Uso

```typescript
import { ValidationService } from './ValidationService';

const validationService = ValidationService.getInstance();

// Validar email
const emailResult = validationService.validateEmail('user@example.com');
if (!emailResult.isValid) {
  console.error('Email inválido:', emailResult.errors);
}

// Validar datos completos
const musicianData = {
  email: 'musician@example.com',
  nombre: 'Juan García',
  instrumento: 'Guitarra',
  contraseña: 'securePassword123'
};

const result = validationService.validateMusician(musicianData);
if (!result.isValid) {
  console.error('Datos inválidos:', result.errors);
}

// Validar con verificación de unicidad
const completeResult = await validationService.validateMusicianComplete(musicianData);
if (!completeResult.isValid) {
  console.error('Validación fallida:', completeResult.errors);
}
```

### 2. ErrorHandler

Manejador centralizado de errores que captura, procesa y notifica errores a través de callbacks.

#### Métodos Principales

```typescript
// Manejar error de validación
handleValidationError(error: ValidationError | Error, context?: string): void

// Manejar error de conexión
handleConnectionError(error: ConnectionError | Error, context?: string): void

// Manejar error de base de datos
handleDatabaseError(error: DatabaseError | Error, context?: string): void

// Manejar error de sincronización
handleSyncError(error: SyncError | Error, context?: string): void

// Manejar error genérico
handleError(error: Error, context?: string): void

// Registrar callback para errores
onError(callback: (notification: ErrorNotification) => void): void

// Desregistrar callback
offError(callback: (notification: ErrorNotification) => void): void

// Obtener todas las notificaciones
getNotifications(): ErrorNotification[]

// Obtener notificaciones recientes
getRecentNotifications(count?: number): ErrorNotification[]

// Limpiar todas las notificaciones
clearNotifications(): void

// Limpiar notificaciones por tipo
clearNotificationsByType(type: 'error' | 'warning' | 'info'): void

// Obtener estadísticas de errores
getErrorStats(): ErrorStats

// Exportar log de errores
exportErrorLog(): string
```

#### Ejemplo de Uso

```typescript
import { ErrorHandler } from './ErrorHandler';
import { ValidationError } from '../../types/errors';

const errorHandler = ErrorHandler.getInstance();

// Registrar callback para notificaciones
errorHandler.onError((notification) => {
  console.log(`[${notification.type}] ${notification.message}`);
  if (notification.details) {
    console.log(`Detalles: ${notification.details}`);
  }
});

// Manejar error de validación
try {
  const error = new ValidationError('Email inválido', 'email', ['Formato no válido']);
  errorHandler.handleValidationError(error);
} catch (error) {
  errorHandler.handleError(error as Error);
}

// Obtener estadísticas
const stats = errorHandler.getErrorStats();
console.log(`Total de errores: ${stats.total}`);
console.log(`Errores: ${stats.errors}, Advertencias: ${stats.warnings}`);
```

### 3. Tipos de Errores Personalizados

Clases de error especializadas para diferentes situaciones.

#### DatabaseError

Error relacionado con operaciones de base de datos.

```typescript
import { DatabaseError } from '../../types/errors';

throw new DatabaseError('No se pudo conectar a la base de datos');
```

#### ValidationError

Error de validación de datos.

```typescript
import { ValidationError } from '../../types/errors';

throw new ValidationError(
  'Datos de músico inválidos',
  'email',
  ['Email no válido', 'Email ya registrado']
);
```

#### ConnectionError

Error de conexión a la base de datos.

```typescript
import { ConnectionError } from '../../types/errors';

// Error retryable
throw new ConnectionError('Timeout de conexión', true);

// Error no retryable
throw new ConnectionError('Autenticación fallida', false);
```

#### SyncError

Error de sincronización entre base de datos y localStorage.

```typescript
import { SyncError } from '../../types/errors';

throw new SyncError(
  'Conflicto de sincronización detectado',
  { local: localData, remote: remoteData }
);
```

## Flujo de Validación

```
Datos de entrada
    ↓
ValidationService.validateMusician()
    ↓
¿Formato válido?
    ├─ No → Retornar errores
    └─ Sí → Verificar unicidad de email
        ↓
        ¿Email único?
        ├─ No → Retornar error
        └─ Sí → Validación exitosa
```

## Flujo de Manejo de Errores

```
Error ocurre
    ↓
ErrorHandler.handleError()
    ↓
¿Tipo de error?
├─ ValidationError → handleValidationError()
├─ ConnectionError → handleConnectionError()
├─ DatabaseError → handleDatabaseError()
├─ SyncError → handleSyncError()
└─ Otro → Manejo genérico
    ↓
Crear notificación
    ↓
Notificar callbacks registrados
    ↓
Guardar en historial
```

## Integración con Servicios Existentes

### Con DatabaseService

```typescript
import { DatabaseService } from './DatabaseService';
import { ValidationService } from './ValidationService';
import { ErrorHandler } from './ErrorHandler';

const databaseService = DatabaseService.getInstance();
const validationService = ValidationService.getInstance();
const errorHandler = ErrorHandler.getInstance();

async function createMusician(data: MusicianData) {
  try {
    // Validar datos
    const validationResult = await validationService.validateMusicianComplete(data);
    if (!validationResult.isValid) {
      throw new ValidationError(
        'Datos inválidos',
        'musician',
        validationResult.errors
      );
    }

    // Guardar en base de datos
    const musician = await databaseService.createMusician(data);
    return musician;
  } catch (error) {
    errorHandler.handleError(error as Error, 'createMusician');
    throw error;
  }
}
```

### Con LocalStorageService

```typescript
import { LocalStorageService } from './LocalStorageService';

const localStorageService = LocalStorageService.getInstance();

// Después de validar y guardar en BD
localStorageService.saveMusician(musician);
```

## Mensajes de Error Localizados

Todos los mensajes de error están en español para mejor UX:

- "El email debe tener un formato válido"
- "El nombre debe tener entre 2 y 100 caracteres"
- "El instrumento debe ser uno de: Guitarra, Piano, Bajo, Batería, Voz, Director"
- "La contraseña debe tener al menos 6 caracteres"
- "Este email ya está registrado en el sistema"
- "Error de conexión a la base de datos"
- "Error de sincronización"

## Testing

### Tests Unitarios

```bash
# Ejecutar tests de ValidationService
npm test -- ValidationService.test.ts

# Ejecutar tests de ErrorHandler
npm test -- ErrorHandler.test.ts

# Ejecutar tests de integración
npm test -- Phase2Integration.test.ts
```

### Cobertura de Tests

- **ValidationService**: 100% de cobertura
  - Validación de email (casos válidos e inválidos)
  - Validación de nombre (longitud mínima y máxima)
  - Validación de instrumento (valores válidos)
  - Validación de contraseña (longitud mínima)
  - Validación completa de músico
  - Verificación de unicidad de email

- **ErrorHandler**: 100% de cobertura
  - Manejo de diferentes tipos de errores
  - Callbacks de notificación
  - Gestión de notificaciones
  - Estadísticas de errores
  - Exportación de logs

## Próximos Pasos (Fase 3)

- Implementar ConnectionManager para gestión de conexión
- Implementar SyncManager para sincronización
- Integrar con sistema de registro existente
- Crear UI para mostrar errores y validaciones

## Notas Importantes

1. **Validación en Cliente**: Todas las validaciones se ejecutan en cliente para mejor UX
2. **Validación en Servidor**: Se debe implementar validación adicional en servidor para seguridad
3. **Mensajes Localizados**: Todos los mensajes están en español
4. **Singleton Pattern**: Ambos servicios usan patrón singleton para instancia única
5. **Logging**: Todos los eventos se registran en el logger centralizado
