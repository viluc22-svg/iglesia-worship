# Database Services

This directory contains all database-related services for the Worship application.

## Services Overview

### DatabaseService

Handles all CRUD operations with the database backend (Firebase or Supabase).

**Key Methods:**
- `createMusician(data: MusicianData): Promise<Musician>` - Create a new musician
- `getMusicians(): Promise<Musician[]>` - Get all musicians
- `getMusician(id: string): Promise<Musician>` - Get a specific musician
- `updateMusician(id: string, data: Partial<MusicianData>): Promise<Musician>` - Update a musician
- `deleteMusician(id: string): Promise<void>` - Delete a musician
- `isEmailUnique(email: string): Promise<boolean>` - Check email uniqueness
- `isConnected(): boolean` - Check connection status

**Usage:**
```typescript
import { DatabaseService } from './services/database/DatabaseService';

const db = DatabaseService.getInstance();

// Create a musician
const musician = await db.createMusician({
  email: 'musician@example.com',
  nombre: 'John Doe',
  instrumento: 'Guitarra',
  contraseña: 'hashed_password',
});

// Get all musicians
const musicians = await db.getMusicians();

// Update a musician
const updated = await db.updateMusician(musician.id, {
  nombre: 'Jane Doe',
});

// Delete a musician
await db.deleteMusician(musician.id);
```

### LocalStorageService

Manages local caching and offline-first functionality using browser localStorage.

**Key Methods:**
- `saveMusician(musician: Musician): void` - Save a musician to cache
- `getMusicians(): Musician[]` - Get all cached musicians
- `getMusician(id: string): Musician | null` - Get a specific cached musician
- `updateMusician(id: string, data: Partial<MusicianData>): void` - Update cached musician
- `deleteMusician(id: string): void` - Delete cached musician
- `addPendingChange(change: PendingChange): void` - Add a pending change
- `getPendingChanges(): PendingChange[]` - Get all pending changes
- `removePendingChange(changeId: string): void` - Remove a pending change
- `clearPendingChanges(): void` - Clear all pending changes
- `clearAll(): void` - Clear all data

**Usage:**
```typescript
import { LocalStorageService } from './services/database/LocalStorageService';

const localStorage = LocalStorageService.getInstance();

// Save a musician
localStorage.saveMusician(musician);

// Get cached musicians
const cached = localStorage.getMusicians();

// Add a pending change
localStorage.addPendingChange({
  id: 'change-1',
  type: 'create',
  musicianId: 'musician-1',
  data: { nombre: 'New Name' },
  timestamp: new Date(),
  retries: 0,
});

// Get pending changes
const pending = localStorage.getPendingChanges();
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Components, Forms, UI Logic)          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Service Layer                      │
│  ┌────────────────────────────────────┐ │
│  │  DatabaseService                  │ │
│  │  LocalStorageService              │ │
│  │  ValidationService (Phase 2)      │ │
│  │  SyncManager (Phase 3)            │ │
│  │  ConnectionManager (Phase 3)      │ │
│  └────────────────────────────────────┘ │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼──────────┐
│  LocalStorage  │   │  Database         │
│  (Browser)     │   │  (Firebase/       │
│                │   │   Supabase)       │
└────────────────┘   └───────────────────┘
```

## Data Flow

### Creating a Musician

1. User submits registration form
2. ValidationService validates the data
3. DatabaseService attempts to save to database
4. If successful:
   - LocalStorageService caches the musician
   - Return success to user
5. If failed:
   - LocalStorageService saves to pending changes
   - Return error to user
   - SyncManager will retry when connection recovers

### Retrieving Musicians

1. Application requests musicians
2. Check if database is connected
3. If connected:
   - DatabaseService fetches from database
   - LocalStorageService updates cache
   - Return data to application
4. If not connected:
   - LocalStorageService returns cached data
   - Show offline indicator to user

### Syncing Pending Changes

1. SyncManager detects connection recovery
2. Get pending changes from LocalStorageService
3. For each pending change:
   - Attempt to apply to database
   - If successful, remove from pending
   - If failed, increment retry count
4. Update LocalStorageService cache
5. Notify application of sync completion

## Error Handling

All services include error handling:

- **Connection Errors**: Logged and handled gracefully
- **Validation Errors**: Returned to caller for user feedback
- **Database Errors**: Logged and stored in pending changes
- **Storage Errors**: Logged but don't block operations

## Logging

All services use the centralized Logger utility:

```typescript
import { Logger } from '../../utils/logger';

Logger.info('ServiceName', 'Operation successful', { data });
Logger.warn('ServiceName', 'Warning message', { data });
Logger.error('ServiceName', 'Error occurred', error);
Logger.debug('ServiceName', 'Debug information', { data });
```

## Testing

Each service should have unit tests:

```bash
npm test -- DatabaseService.test.ts
npm test -- LocalStorageService.test.ts
```

## Phase 2: Validation and Error Handling

### ValidationService

Handles all data validation for musicians.

**Key Methods:**
- `validateEmail(email: string): ValidationResult` - Validate email format
- `validateName(name: string): ValidationResult` - Validate name (2-100 chars)
- `validateInstrument(instrument: string): ValidationResult` - Validate instrument
- `validatePassword(password: string): ValidationResult` - Validate password (min 6 chars)
- `validateMusician(data: MusicianData): ValidationResult` - Validate complete musician data
- `validateMusicianComplete(data: MusicianData): Promise<ValidationResult>` - Validate with email uniqueness check
- `isEmailUnique(email: string): Promise<boolean>` - Check if email is unique
- `getValidationRules()` - Get validation rules for UI

**Usage:**
```typescript
import { ValidationService } from './services/database/ValidationService';

const validation = ValidationService.getInstance();

// Validate email
const emailResult = validation.validateEmail('user@example.com');

// Validate complete musician data
const result = await validation.validateMusicianComplete({
  email: 'musician@example.com',
  nombre: 'Juan García',
  instrumento: 'Guitarra',
  contraseña: 'password123',
});

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}
```

### ErrorHandler

Centralized error handling with notification system.

**Key Methods:**
- `handleValidationError(error: ValidationError | Error, context?: string): void`
- `handleConnectionError(error: ConnectionError | Error, context?: string): void`
- `handleDatabaseError(error: DatabaseError | Error, context?: string): void`
- `handleSyncError(error: SyncError | Error, context?: string): void`
- `handleError(error: Error, context?: string): void`
- `onError(callback: (notification: ErrorNotification) => void): void` - Register error callback
- `getNotifications(): ErrorNotification[]` - Get all notifications
- `getErrorStats()` - Get error statistics
- `exportErrorLog(): string` - Export logs as JSON

**Usage:**
```typescript
import { ErrorHandler } from './services/database/ErrorHandler';
import { ValidationError } from '../../types/errors';

const errorHandler = ErrorHandler.getInstance();

// Register error callback
errorHandler.onError((notification) => {
  console.log(`[${notification.type}] ${notification.message}`);
});

// Handle validation error
const error = new ValidationError('Invalid data', 'field', ['Error 1', 'Error 2']);
errorHandler.handleValidationError(error);
```

### Custom Error Types

Located in `src/types/errors.ts`:

- `DatabaseError` - Database operation errors
- `ValidationError` - Data validation errors
- `ConnectionError` - Connection errors (with retry support)
- `SyncError` - Synchronization errors

## Future Enhancements

- Phase 3: ConnectionManager for connection handling
- Phase 3: SyncManager for offline sync
- Phase 4: Integration with existing registration system
- Phase 5: Comprehensive testing
- Phase 6: Performance optimization

## Configuration

Services are configured via environment variables in `.env.local`:

```
VITE_DB_TYPE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

See `DATABASE_SETUP.md` for detailed configuration instructions.
