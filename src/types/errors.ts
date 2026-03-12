/**
 * Custom Error Types
 * Specialized error classes for different error scenarios
 */

/**
 * Base custom error class
 */
export class CustomError extends Error {
  context: string;

  constructor(message: string, context: string) {
    super(message);
    this.context = context;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends CustomError {
  constructor(message: string, context: string = 'DatabaseService') {
    super(message, context);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends CustomError {
  field: string;
  errors: string[];

  constructor(message: string, field: string = '', errors: string[] = [], context: string = 'ValidationService') {
    super(message, context);
    this.field = field;
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Connection-related errors
 */
export class ConnectionError extends CustomError {
  retryable: boolean;

  constructor(message: string, retryable: boolean = true, context: string = 'ConnectionManager') {
    super(message, context);
    this.retryable = retryable;
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Synchronization-related errors
 */
export class SyncError extends CustomError {
  conflictData?: any;

  constructor(message: string, conflictData?: any, context: string = 'SyncManager') {
    super(message, context);
    this.conflictData = conflictData;
    Object.setPrototypeOf(this, SyncError.prototype);
  }
}
