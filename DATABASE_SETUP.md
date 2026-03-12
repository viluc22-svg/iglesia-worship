# Database Integration Setup Guide

This guide explains how to set up the database integration for the Worship application.

## Overview

The Worship application supports two database backends:
- **Firebase Realtime Database** (recommended for quick setup)
- **Supabase** (PostgreSQL-based, more scalable)

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- A Firebase or Supabase account

## Setup Instructions

### Option 1: Firebase Setup

#### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter project name: "Worship"
4. Accept the terms and create the project
5. Wait for the project to be created

#### 2. Enable Realtime Database

1. In the Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select your preferred region
5. Click "Enable"

#### 3. Get Firebase Credentials

1. Go to Project Settings (gear icon)
2. Click "Service Accounts" tab
3. Click "Generate New Private Key"
4. Copy the credentials

For web app, use the config from:
1. Project Settings → General tab
2. Scroll to "Your apps" section
3. Click the web app (or create one)
4. Copy the Firebase config

#### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Firebase credentials:
   ```
   VITE_DB_TYPE=firebase
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   ```

#### 5. Install Firebase SDK

```bash
npm install firebase
```

### Option 2: Supabase Setup

#### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Click "Start your project"
3. Sign in or create an account
4. Click "New project"
5. Enter project name: "Worship"
6. Create a strong password
7. Select your region
8. Click "Create new project"

#### 2. Create Musicians Table

1. Go to the SQL Editor
2. Run the following SQL:

```sql
CREATE TABLE musicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  instrumento VARCHAR(50) NOT NULL,
  rol VARCHAR(20) DEFAULT 'user',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contraseña VARCHAR(255) NOT NULL
);

CREATE INDEX idx_email ON musicians(email);
CREATE INDEX idx_instrumento ON musicians(instrumento);
CREATE INDEX idx_fecha_registro ON musicians(fecha_registro);
```

#### 3. Get Supabase Credentials

1. Go to Project Settings → API
2. Copy the Project URL and Anon Key

#### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   VITE_DB_TYPE=supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

#### 5. Install Supabase SDK

```bash
npm install @supabase/supabase-js
```

## Database Schema

### Musicians Table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| email | VARCHAR(255) | User email (unique) |
| nombre | VARCHAR(100) | Musician's name |
| instrumento | VARCHAR(50) | Instrument played |
| rol | VARCHAR(20) | User role (user/admin) |
| fecha_registro | TIMESTAMP | Registration date |
| fecha_actualizacion | TIMESTAMP | Last update date |
| contraseña | VARCHAR(255) | Hashed password (bcrypt) |

## Security Rules

### Firebase Realtime Database

```json
{
  "rules": {
    "musicians": {
      ".read": "auth != null",
      ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'",
      "$uid": {
        ".validate": "newData.hasChildren(['email', 'nombre', 'instrumento', 'rol', 'fechaRegistro', 'fechaActualizacion', 'contraseña'])"
      }
    }
  }
}
```

### Supabase Row Level Security

```sql
-- Enable RLS
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read musicians"
ON musicians FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow admins to write
CREATE POLICY "Allow admins to write musicians"
ON musicians FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

## Testing the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser

3. Try registering a new musician

4. Check your database to verify the data was saved

## Troubleshooting

### Connection Issues

- Verify environment variables are correctly set
- Check that your database is accessible
- Review browser console for error messages
- Check network tab in DevTools

### Authentication Issues

- Ensure your database credentials are correct
- Verify security rules allow the operations
- Check that the user has appropriate permissions

### Data Not Saving

- Check browser console for errors
- Verify localStorage is enabled
- Check database connection status
- Review pending changes in localStorage

## Next Steps

1. Implement password hashing with bcrypt
2. Set up validation service
3. Implement sync manager for offline support
4. Add error handling and user notifications
5. Set up monitoring and logging

## Support

For issues or questions:
1. Check the error logs in browser console
2. Review the database security rules
3. Verify environment variables
4. Check the application logs in localStorage

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
