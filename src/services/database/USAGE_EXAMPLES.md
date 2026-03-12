# Ejemplos de Uso - Fase 2

## Ejemplo 1: Validar Datos de Registro

```typescript
import { ValidationService } from './ValidationService';
import { ErrorHandler } from './ErrorHandler';
import { ValidationError } from '../../types/errors';

async function handleRegistration(formData: any) {
  const validationService = ValidationService.getInstance();
  const errorHandler = ErrorHandler.getInstance();

  try {
    // Validar datos del formulario
    const result = await validationService.validateMusicianComplete({
      email: formData.email,
      nombre: formData.nombre,
      instrumento: formData.instrumento,
      contraseña: formData.contraseña,
    });

    if (!result.isValid) {
      // Mostrar errores de validación
      const error = new ValidationError(
        'Por favor, corrija los siguientes errores:',
        'musician',
        result.errors
      );
      errorHandler.handleValidationError(error);
      return false;
    }

    // Datos válidos, proceder con registro
    console.log('Datos válidos, registrando usuario...');
    return true;
  } catch (error) {
    errorHandler.handleError(error as Error, 'handleRegistration');
    return false;
  }
}
```

## Ejemplo 2: Mostrar Errores en UI

```typescript
import { ErrorHandler } from './ErrorHandler';

function setupErrorNotifications() {
  const errorHandler = ErrorHandler.getInstance();

  // Registrar callback para mostrar errores
  errorHandler.onError((notification) => {
    // Mostrar notificación en UI
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification notification-${notification.type}`;
    notificationElement.innerHTML = `
      <div class="notification-message">${notification.message}</div>
      ${notification.details ? `<div class="notification-details">${notification.details}</div>` : ''}
    `;

    document.body.appendChild(notificationElement);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      notificationElement.remove();
    }, 5000);
  });
}
```

## Ejemplo 3: Validar Email Único

```typescript
import { ValidationService } from './ValidationService';

async function checkEmailAvailability(email: string) {
  const validationService = ValidationService.getInstance();

  try {
    // Validar formato primero
    const formatResult = validationService.validateEmail(email);
    if (!formatResult.isValid) {
      return {
        available: false,
        message: formatResult.errors[0],
      };
    }

    // Verificar unicidad
    const isUnique = await validationService.isEmailUnique(email);
    if (!isUnique) {
      return {
        available: false,
        message: 'Este email ya está registrado',
      };
    }

    return {
      available: true,
      message: 'Email disponible',
    };
  } catch (error) {
    return {
      available: false,
      message: 'Error al verificar disponibilidad del email',
    };
  }
}
```

## Ejemplo 4: Validar Instrumento

```typescript
import { ValidationService } from './ValidationService';

function setupInstrumentSelector() {
  const validationService = ValidationService.getInstance();
  const rules = validationService.getValidationRules();

  // Obtener lista de instrumentos válidos
  const instrumentSelect = document.getElementById('instrument');
  rules.instruments.forEach(instrument => {
    const option = document.createElement('option');
    option.value = instrument;
    option.textContent = instrument;
    instrumentSelect?.appendChild(option);
  });

  // Validar selección
  instrumentSelect?.addEventListener('change', (e) => {
    const selected = (e.target as HTMLSelectElement).value;
    const result = validationService.validateInstrument(selected);
    console.log('Instrumento válido:', result.isValid);
  });
}
```

## Ejemplo 5: Validar Contraseña en Tiempo Real

```typescript
import { ValidationService } from './ValidationService';

function setupPasswordValidation() {
  const validationService = ValidationService.getInstance();
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const feedbackElement = document.getElementById('password-feedback');

  passwordInput?.addEventListener('input', (e) => {
    const password = (e.target as HTMLInputElement).value;
    const result = validationService.validatePassword(password);

    if (feedbackElement) {
      if (result.isValid) {
        feedbackElement.textContent = '✓ Contraseña válida';
        feedbackElement.className = 'feedback valid';
      } else {
        feedbackElement.textContent = result.errors[0];
        feedbackElement.className = 'feedback invalid';
      }
    }
  });
}
```

## Ejemplo 6: Manejo de Errores de Conexión

```typescript
import { ErrorHandler } from './ErrorHandler';
import { ConnectionError } from '../../types/errors';

function handleConnectionError(error: Error) {
  const errorHandler = ErrorHandler.getInstance();

  if (error.message.includes('timeout')) {
    const connError = new ConnectionError(
      'La conexión tardó demasiado. Reintentando...',
      true // retryable
    );
    errorHandler.handleConnectionError(connError);
  } else if (error.message.includes('refused')) {
    const connError = new ConnectionError(
      'No se pudo conectar a la base de datos',
      false // not retryable
    );
    errorHandler.handleConnectionError(connError);
  }
}
```

## Ejemplo 7: Obtener Estadísticas de Errores

```typescript
import { ErrorHandler } from './ErrorHandler';

function displayErrorStats() {
  const errorHandler = ErrorHandler.getInstance();
  const stats = errorHandler.getErrorStats();

  console.log(`
    Estadísticas de Errores:
    - Total: ${stats.total}
    - Errores: ${stats.errors}
    - Advertencias: ${stats.warnings}
    - Información: ${stats.info}
  `);

  // Mostrar en UI
  const statsElement = document.getElementById('error-stats');
  if (statsElement) {
    statsElement.innerHTML = `
      <p>Total de errores: ${stats.total}</p>
      <p>Errores: ${stats.errors}</p>
      <p>Advertencias: ${stats.warnings}</p>
    `;
  }
}
```

## Ejemplo 8: Exportar Logs de Error

```typescript
import { ErrorHandler } from './ErrorHandler';

function exportErrorLogs() {
  const errorHandler = ErrorHandler.getInstance();
  const logData = errorHandler.exportErrorLog();

  // Crear blob y descargar
  const blob = new Blob([logData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `error-logs-${new Date().toISOString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
```

## Ejemplo 9: Validar Nombre

```typescript
import { ValidationService } from './ValidationService';

function validateMusicianName(name: string) {
  const validationService = ValidationService.getInstance();
  const result = validationService.validateName(name);

  if (!result.isValid) {
    console.error('Nombre inválido:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }

  console.log('Nombre válido');
  return true;
}

// Ejemplos
validateMusicianName('Juan García');      // ✓ Válido
validateMusicianName('J');                // ✗ Muy corto
validateMusicianName('a'.repeat(101));    // ✗ Muy largo
```

## Ejemplo 10: Validación Completa de Músico

```typescript
import { ValidationService } from './ValidationService';
import { ErrorHandler } from './ErrorHandler';
import { ValidationError } from '../../types/errors';

async function validateAndRegisterMusician(musicianData: any) {
  const validationService = ValidationService.getInstance();
  const errorHandler = ErrorHandler.getInstance();

  try {
    // Validar todos los campos
    const result = await validationService.validateMusicianComplete({
      email: musicianData.email,
      nombre: musicianData.nombre,
      instrumento: musicianData.instrumento,
      contraseña: musicianData.contraseña,
      rol: musicianData.rol || 'user',
    });

    if (!result.isValid) {
      const error = new ValidationError(
        'Validación fallida',
        'musician',
        result.errors
      );
      errorHandler.handleValidationError(error);
      return null;
    }

    // Proceder con registro
    console.log('Datos validados correctamente');
    return musicianData;
  } catch (error) {
    errorHandler.handleError(error as Error, 'validateAndRegisterMusician');
    return null;
  }
}
```

## Ejemplo 11: Limpiar Notificaciones

```typescript
import { ErrorHandler } from './ErrorHandler';

function clearErrorNotifications() {
  const errorHandler = ErrorHandler.getInstance();

  // Limpiar todas las notificaciones
  errorHandler.clearNotifications();

  // O limpiar solo errores
  errorHandler.clearNotificationsByType('error');

  // O limpiar solo advertencias
  errorHandler.clearNotificationsByType('warning');
}
```

## Ejemplo 12: Obtener Notificaciones Recientes

```typescript
import { ErrorHandler } from './ErrorHandler';

function displayRecentErrors() {
  const errorHandler = ErrorHandler.getInstance();
  const recentErrors = errorHandler.getRecentNotifications(5);

  const errorList = document.getElementById('error-list');
  if (errorList) {
    errorList.innerHTML = recentErrors
      .map(notification => `
        <div class="error-item error-${notification.type}">
          <strong>${notification.message}</strong>
          ${notification.details ? `<p>${notification.details}</p>` : ''}
          <small>${notification.timestamp.toLocaleTimeString()}</small>
        </div>
      `)
      .join('');
  }
}
```

## Ejemplo 13: Validar Rol

```typescript
import { ValidationService } from './ValidationService';

function validateUserRole(role: string) {
  const validationService = ValidationService.getInstance();

  // Crear datos de prueba con el rol
  const testData = {
    email: 'test@example.com',
    nombre: 'Test User',
    instrumento: 'Guitarra',
    contraseña: 'password123',
    rol: role as any,
  };

  const result = validationService.validateMusician(testData);

  if (!result.isValid) {
    const roleError = result.errors.find(e => e.includes('rol'));
    if (roleError) {
      console.error('Rol inválido:', roleError);
      return false;
    }
  }

  console.log('Rol válido');
  return true;
}

// Ejemplos
validateUserRole('user');       // ✓ Válido
validateUserRole('admin');      // ✓ Válido
validateUserRole('superadmin'); // ✗ Inválido
```

## Ejemplo 14: Desregistrar Callback de Error

```typescript
import { ErrorHandler } from './ErrorHandler';

function setupAndCleanupErrorHandling() {
  const errorHandler = ErrorHandler.getInstance();

  // Definir callback
  const myErrorCallback = (notification: any) => {
    console.log('Error:', notification.message);
  };

  // Registrar
  errorHandler.onError(myErrorCallback);

  // Usar...

  // Desregistrar cuando ya no sea necesario
  errorHandler.offError(myErrorCallback);
}
```

## Ejemplo 15: Obtener Reglas de Validación para UI

```typescript
import { ValidationService } from './ValidationService';

function setupValidationUI() {
  const validationService = ValidationService.getInstance();
  const rules = validationService.getValidationRules();

  // Mostrar requisitos de contraseña
  const passwordRequirements = document.getElementById('password-requirements');
  if (passwordRequirements) {
    passwordRequirements.innerHTML = `
      <p>La contraseña debe tener al menos ${rules.password.minLength} caracteres</p>
    `;
  }

  // Mostrar requisitos de nombre
  const nameRequirements = document.getElementById('name-requirements');
  if (nameRequirements) {
    nameRequirements.innerHTML = `
      <p>El nombre debe tener entre ${rules.name.minLength} y ${rules.name.maxLength} caracteres</p>
    `;
  }

  // Mostrar instrumentos disponibles
  const instrumentOptions = document.getElementById('instrument-options');
  if (instrumentOptions) {
    instrumentOptions.innerHTML = `
      <p>Instrumentos disponibles: ${rules.instruments.join(', ')}</p>
    `;
  }
}
```
