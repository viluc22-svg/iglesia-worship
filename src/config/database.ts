/**
 * Database Configuration
 * Supports both Firebase and Supabase backends
 * 
 * Environment variables required:
 * - VITE_DB_TYPE: 'firebase' or 'supabase'
 * - VITE_FIREBASE_API_KEY (if using Firebase)
 * - VITE_FIREBASE_PROJECT_ID (if using Firebase)
 * - VITE_FIREBASE_DATABASE_URL (if using Firebase)
 * - VITE_SUPABASE_URL (if using Supabase)
 * - VITE_SUPABASE_ANON_KEY (if using Supabase)
 */

export interface DatabaseConfig {
  type: 'firebase' | 'supabase';
  apiKey?: string;
  projectId?: string;
  databaseUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (import.meta.env.VITE_DB_TYPE || 'firebase') as 'firebase' | 'supabase';

  if (dbType === 'firebase') {
    return {
      type: 'firebase',
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      databaseUrl: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    };
  } else {
    return {
      type: 'supabase',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
  }
}

/**
 * Validate that required configuration is present
 */
export function validateDatabaseConfig(config: DatabaseConfig): boolean {
  if (config.type === 'firebase') {
    return !!(config.apiKey && config.projectId && config.databaseUrl);
  } else {
    return !!(config.supabaseUrl && config.supabaseAnonKey);
  }
}
