# Arquitectura Técnica - Integración de Base de Datos

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de Capas](#arquitectura-de-capas)
3. [Componentes Principales](#componentes-principales)
4. [Flujos de Datos](#flujos-de-datos)
5. [Manejo de Errores](#manejo-de-errores)
6. [Sincronización](#sincronización)
7. [Seguridad](#seguridad)
8. [Performance](#performance)

## Visión General

La integración de base de datos en la aplicación Worship proporciona:

- **Persistencia centralizada** de datos de músicos
- **Sincronización bidireccional** entre BD y localStorage
- **Funcionalidad offline-first** con caché local
- **Manejo robusto de errores** de conexión
- **Validación completa** de datos
- **Logging exhaustivo** para debugging y auditoría

### Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    Aplicación Worship                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Capa de Presentación (UI)                  │   │
│  │  (Componentes React, Formularios, Vistas)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Capa de Integración (Phase4Integration)       │   │
│  │  (Funciones wrapper, Conversión de formatos)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Capa de Lógica de Negocio                     │   │
│  │  (Servicios, Validadores, Gestores)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Capa de Acceso a Datos (DAL)                    │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  DatabaseService  │  LocalStorageService      │  │   │
│  │  │  SyncManager      │  ValidationService        │  │   │
│  │  │  ConnectionManager│  ErrorHandler             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↓                                    ↓              │
│  ┌──────────────────────┐          ┌──────────────────────┐ │
│  │   LocalStorage       │          │  Base de Datos       │ │
│  │   (Caché Local)      │          │  (Firebase/Supabase) │ │ 
│  └──────────────────────┘          └──────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. DatabaseService

**Ubicación:** `src/services/database/DatabaseService.ts`

Servicio responsable de todas las operaciones CRUD con la base de datos.

**Métodos Principales:**

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `createMusician(data)` | Crea nuevo músico en BD | `Promise<Musician>` |
| `getMusicians()` | Obtiene todos los músicos | `Promise<Musician[]>` |
| `getMusician(id)` | Obtiene músico específico | `Promise<Musician>` |
| `updateMusician(id, data)` | Actualiza músico | `Promise<Musician>` |
| `deleteMusician(id)` | Elimina músico | `Promise<void>` |
| `isEmailUnique(email)` | Verifica email único | `Promise<boolean>` |
| `isConnected()` | Estado de conexión | `boolean` |

**Ejemplo de Uso:**

```typescript
import { DatabaseService } from './services/database/DatabaseService';

const db = DatabaseService.getInstance();

// Crear músico
const musician = await db.createMusician({
  email: 'musician@example.com',
  nombre: 'Juan García',
  instrumento: 'Guitarra',
  contraseña: 'hashed_password',
});

// Obtener todos
const all = await db.getMusicians();

// Actualizar
const updated = await db.updateMusician(musician.id, {
  nombre: 'Juan García López',
});

// Eliminar
await db.deleteMusician(musician.id);
```

### 2. LocalStorageService

**Ubicación:** `src/services/database/LocalStorageService.ts`

Gestiona caché local y sincronización offline-first.

**Métodos Principales:**

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `saveMusician(musician)` | Guarda en caché | `void` |
| `getMusicians()` | Obtiene caché | `Musician[]` |
| `updateMusician(id, data)` | Actualiza caché | `void` |
| `deleteMusician(id)` | Elimina de caché | `void` |
| `addPendingChange(change)` | Agrega cambio pendiente | `void` |
| `getPendingChanges()` | Obtiene cambios pendientes | `PendingChange[]` |
| `clearPendingChanges()` | Limpia cambios pendientes | `void` |

### 3. ValidationService

**Ubicación:** `src/services/database/ValidationService.ts`

Valida integridad y formato de datos.

**Validaciones Implementadas:**

- Email: Formato válido y único
- Nombre: 2-100 caracteres
- Instrumento: Valor válido (Guitarra, Piano, Bajo, Batería, Voz, Director)
- Contraseña: Mínimo 6 caracteres
- Rol: 'user' o 'admin'

### 4. ErrorHandler

**Ubicación:** `src/services/database/ErrorHandler.ts`

Manejo centralizado de errores con notificaciones.

**Tipos de Errores:**

- `ValidationError` - Errores de validación
- `ConnectionError` - Errores de conexión
- `DatabaseError` - Errores de BD
- `SyncError` - Errores de sincronización

### 5. ConnectionManager

**Ubicación:** `src/services/database/ConnectionManager.ts`

Gestiona conectividad con la base de datos.

**Características:**

- Detección automática de cambios de conectividad
- Reintentos con backoff exponencial
- Notificaciones de cambios de estado
- Manejo de timeouts

### 6. SyncManager

**Ubicación:** `src/services/database/SyncManager.ts`

Sincroniza cambios entre BD y localStorage.

**Características:**

- Sincronización bidireccional
- Resolución de conflictos por timestamp
- Sincronización periódica (cada 30 segundos)
- Logging de cambios sincronizados

### 7. Phase4Integration

**Ubicación:** `src/services/database/Phase4Integration.ts`

Funciones wrapper para integración con sistema existente.

**Funciones Principales:**

- `registerUserWithDB()` - Registra usuario
- `createMusicianWithDB()` - Crea músico
- `updateMusicianWithDB()` - Actualiza músico
- `deleteMusicianWithDB()` - Elimina músico
- `loadMusicians()` - Carga músicos
- `initializeDatabaseServices()` - Inicializa servicios

## Flujos de Datos

### Flujo 1: Crear Nuevo Músico

```
Usuario registra
    ↓
Phase4Integration.registerUserWithDB()
    ↓
ValidationService.validateMusicianComplete()
    ↓
¿Válido?
    ├─ No → Retornar error
    └─ Sí → DatabaseService.createMusician()
        ↓
        ¿Conectado?
        ├─ Sí → Guardar en BD
        │   ↓
        │   LocalStorageService.saveMusician()
        │   ↓
        │   Retornar éxito
        └─ No → LocalStorageService.addPendingChange()
            ↓
            Retornar error (será sincronizado después)
```

### Flujo 2: Cargar Músicos al Iniciar

```
App inicia
    ↓
Phase4Integration.initializeDatabaseServices()
    ↓
ConnectionManager.connect()
    ↓
¿Conectado?
├─ Sí → DatabaseService.getMusicians()
│   ↓
│   LocalStorageService.saveMusician() (para cada uno)
│   ↓
│   Retornar datos
└─ No → LocalStorageService.getMusicians()
    ↓
    Mostrar indicador "Datos pueden no estar actualizados"
    ↓
    Retornar datos en caché
```

### Flujo 3: Sincronización Periódica

```
Cada 30 segundos
    ↓
SyncManager.syncPendingChanges()
    ↓
¿Hay cambios pendientes?
├─ No → Continuar
└─ Sí → Para cada cambio:
    ├─ Obtener versión remota
    ├─ Resolver conflicto (si existe)
    ├─ Aplicar a BD
    ├─ Actualizar localStorage
    └─ Remover de pendientes
```

### Flujo 4: Actualizar Músico

```
Admin edita músico
    ↓
Phase4Integration.updateMusicianWithDB()
    ↓
ValidationService.validateMusicianComplete()
    ↓
¿Válido?
├─ No → Retornar error
└─ Sí → DatabaseService.updateMusician()
    ↓
    ¿Conectado?
    ├─ Sí → Actualizar en BD
    │   ↓
    │   LocalStorageService.updateMusician()
    │   ↓
    │   Retornar éxito
    └─ No → LocalStorageService.addPendingChange()
        ↓
        Retornar error (será sincronizado después)
```

## Manejo de Errores

### Estrategia de Reintentos

```
Intento 1: Inmediato
    ↓ Falla
Esperar 1 segundo
    ↓
Intento 2: Después de 1s
    ↓ Falla
Esperar 4 segundos
    ↓
Intento 3: Después de 4s
    ↓ Falla
Guardar en cola pendiente
    ↓
Sincronizar cuando conexión se recupere
```

### Tipos de Errores y Manejo

| Error | Causa | Manejo |
|-------|-------|--------|
| ValidationError | Datos inválidos | Mostrar al usuario, no guardar |
| ConnectionError | BD no disponible | Guardar en pendientes, reintentar |
| DatabaseError | Error en BD | Registrar, mostrar mensaje genérico |
| SyncError | Error sincronizando | Registrar, reintentar después |
| AuthError | No autenticado | Redirigir a login |

### Notificaciones de Error

Los errores se notifican a través de:

1. **Consola** (en desarrollo)
2. **Logger** (para auditoría)
3. **UI** (mensajes al usuario)
4. **ErrorHandler callbacks** (para aplicación)

## Sincronización

### Resolución de Conflictos

Cuando hay conflicto entre versión local y remota:

```
Conflicto detectado
    ↓
Comparar timestamps
    ↓
Usar versión más reciente
    ↓
Actualizar ambas (BD y localStorage)
    ↓
Registrar en logs
```

### Cambios Pendientes

Estructura de cambio pendiente:

```typescript
interface PendingChange {
  id: string;                    // ID único del cambio
  type: 'create' | 'update' | 'delete';
  musicianId: string;            // ID del músico afectado
  data: Partial<Musician>;       // Datos del cambio
  timestamp: Date;               // Cuándo se realizó
  retries: number;               // Intentos de sincronización
}
```

### Sincronización Periódica

- **Intervalo:** 30 segundos
- **Condición:** Solo si hay cambios pendientes
- **Máximo de reintentos:** 3 por cambio
- **Backoff:** Exponencial (1s, 4s, 16s)

## Seguridad

### Contraseñas

- **Hashing:** bcrypt con 10 salt rounds
- **Transmisión:** HTTPS/TLS obligatorio
- **Almacenamiento:** Nunca en texto plano
- **Validación:** En cliente (UX) y servidor (seguridad)

### Datos en Tránsito

- **Protocolo:** HTTPS/TLS
- **Validación:** Certificados SSL
- **Encriptación:** TLS 1.2+

### Datos en Reposo

- **localStorage:** Datos en caché (no sensibles)
- **BD:** Contraseñas hasheadas
- **Logs:** Sin información sensible

### Validación

- **Cliente:** Validación inmediata (UX)
- **Servidor:** Validación obligatoria (seguridad)
- **Sanitización:** Todos los inputs

## Performance

### Caché

- **Ubicación:** localStorage del navegador
- **Tamaño máximo:** ~5MB (depende del navegador)
- **Actualización:** Cada operación
- **Limpieza:** Automática de datos antiguos

### Sincronización

- **Intervalo:** 30 segundos
- **Batch:** Múltiples cambios en una operación
- **Debouncing:** Para operaciones frecuentes
- **Timeout:** 10 segundos por operación

### Índices de BD

```sql
CREATE INDEX idx_email ON musicians(email);
CREATE INDEX idx_instrumento ON musicians(instrumento);
CREATE INDEX idx_fecha_registro ON musicians(fecha_registro);
```

### Optimizaciones

1. **Caché en memoria** para acceso rápido
2. **Lazy loading** de datos grandes
3. **Paginación** para listas grandes
4. **Compresión** de datos en tránsito
5. **CDN** para archivos estáticos

## Logging

### Eventos Registrados

- Conexión/desconexión
- Operaciones CRUD
- Errores de conexión
- Conflictos de sincronización
- Cambios sincronizados
- Validaciones fallidas

### Formato de Log

```
[TIMESTAMP] [NIVEL] [CONTEXTO] Mensaje
Ejemplo: [2024-01-15 10:30:45] [ERROR] [DatabaseService] Connection timeout
```

### Niveles de Log

- **DEBUG:** Información detallada
- **INFO:** Eventos importantes
- **WARN:** Advertencias
- **ERROR:** Errores

### Acceso a Logs

```typescript
import { Logger } from './utils/logger';

// Obtener todos los logs
const logs = Logger.getLogs();

// Filtrar por nivel
const errors = Logger.getLogsByLevel('error');

// Filtrar por contexto
const dbLogs = Logger.getLogsByContext('DatabaseService');

// Exportar
const json = Logger.exportLogs();
const csv = Logger.exportLogsAsCSV();
```

## Configuración

### Variables de Entorno

```
VITE_DB_TYPE=firebase|supabase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...
```

### Inicialización

```typescript
import { initializeDatabaseServices } from './services/database/Phase4Integration';

// En main.ts
await initializeDatabaseServices();
```

## Monitoreo

### Métricas Clave

- Tiempo de respuesta de BD
- Tasa de errores de conexión
- Cambios pendientes sin sincronizar
- Tamaño de caché local
- Número de conflictos resueltos

### Alertas

- Conexión perdida > 5 minutos
- Cambios pendientes > 100
- Errores > 10 en 1 hora
- Tamaño caché > 4MB

## Próximos Pasos

1. **Optimizaciones:** Caché en memoria, paginación
2. **Mejoras UX:** Indicadores visuales, notificaciones
3. **Monitoreo:** Dashboards, alertas
4. **Escalabilidad:** Sharding, replicación
