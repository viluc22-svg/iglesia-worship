# Guía de Deployment - Integración de Base de Datos

## Tabla de Contenidos

1. [Pre-Deployment](#pre-deployment)
2. [Configuración de Producción](#configuración-de-producción)
3. [Testing en Staging](#testing-en-staging)
4. [Proceso de Deployment](#proceso-de-deployment)
5. [Plan de Rollback](#plan-de-rollback)
6. [Post-Deployment](#post-deployment)
7. [Checklist](#checklist)

## Pre-Deployment

### 1. Revisión de Seguridad

#### Credenciales

- [ ] Verificar que NO hay credenciales en código fuente
- [ ] Verificar que .env.local NO está en git
- [ ] Verificar que .env.local está en .gitignore
- [ ] Usar variables de entorno para todas las credenciales

```bash
# Verificar que no hay credenciales expuestas
git log --all --full-history -S "FIREBASE_API_KEY" -- .
git log --all --full-history -S "SUPABASE_KEY" -- .
```

#### Contraseñas

- [ ] Verificar que contraseñas se hashean con bcrypt
- [ ] Verificar que nunca se transmiten en texto plano
- [ ] Verificar que se validan en servidor

```typescript
// Correcto
const hashedPassword = await bcrypt.hash(password, 10);

// Incorrecto
const plainPassword = password; // ❌ NUNCA
```

#### HTTPS/TLS

- [ ] Verificar que todas las conexiones usan HTTPS
- [ ] Verificar que certificados SSL son válidos
- [ ] Verificar que no hay mixed content (HTTP + HTTPS)

```typescript
// Verificar en DatabaseService
const url = process.env.VITE_FIREBASE_DATABASE_URL;
if (!url.startsWith('https://')) {
  throw new Error('Database URL must use HTTPS');
}
```

#### Validación

- [ ] Verificar que validación ocurre en cliente Y servidor
- [ ] Verificar que inputs se sanitizan
- [ ] Verificar que no hay SQL injection posible

### 2. Testing Completo

```bash
# Ejecutar todos los tests
npm run test -- --run

# Verificar cobertura
npm run test -- --coverage

# Ejecutar tests de integración
npm run test -- Phase4Integration.test.ts --run

# Verificar build
npm run build

# Verificar que no hay errores TypeScript
npx tsc --noEmit
```

### 3. Revisión de Código

- [ ] Revisar cambios en main.ts
- [ ] Revisar cambios en servicios
- [ ] Revisar cambios en tipos
- [ ] Verificar que no hay console.log en producción

```bash
# Buscar console.log
grep -r "console\." src/ --include="*.ts" --exclude="*.test.ts"

# Buscar TODO/FIXME
grep -r "TODO\|FIXME" src/ --include="*.ts"
```

### 4. Documentación

- [ ] Documentación técnica completa
- [ ] Documentación para desarrolladores
- [ ] Guía de troubleshooting
- [ ] Guía de monitoreo
- [ ] Plan de rollback

## Configuración de Producción

### 1. Variables de Entorno

Crear archivo `.env.production` con:

```bash
# Base de Datos
VITE_DB_TYPE=firebase
VITE_FIREBASE_API_KEY=prod_api_key
VITE_FIREBASE_AUTH_DOMAIN=prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prod_project_id
VITE_FIREBASE_STORAGE_BUCKET=prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=prod_sender_id
VITE_FIREBASE_APP_ID=prod_app_id
VITE_FIREBASE_DATABASE_URL=https://prod.firebaseio.com

# Logging
VITE_LOG_LEVEL=warn

# Monitoreo
VITE_ENABLE_MONITORING=true
VITE_MONITORING_URL=https://monitoring.example.com
```

### 2. Configuración de Firebase

#### Crear Proyecto de Producción

```bash
# En Firebase Console
1. Crear nuevo proyecto "iglesia-worship-prod"
2. Habilitar Realtime Database
3. Configurar reglas de seguridad
4. Crear índices necesarios
```

#### Reglas de Seguridad Firebase

```json
{
  "rules": {
    "musicians": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      "$musicianId": {
        ".validate": "newData.hasChildren(['email', 'nombre', 'instrumento', 'rol'])",
        "email": {
          ".validate": "newData.isString() && newData.val().matches(/^[^@]+@[^@]+\\.[^@]+$/)"
        },
        "nombre": {
          ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 100"
        },
        "instrumento": {
          ".validate": "newData.isString() && ['Guitarra', 'Piano', 'Bajo', 'Batería', 'Voz', 'Director'].indexOf(newData.val()) >= 0"
        },
        "rol": {
          ".validate": "newData.isString() && ['user', 'admin'].indexOf(newData.val()) >= 0"
        }
      }
    }
  }
}
```

#### Crear Índices

```bash
# En Firebase Console → Realtime Database → Indexes
# Crear índices para:
# - musicians/email (para búsqueda rápida)
# - musicians/instrumento (para filtrado)
# - musicians/fechaRegistro (para ordenamiento)
```

### 3. Configuración de Supabase (Alternativa)

```sql
-- Crear tabla
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

-- Crear índices
CREATE INDEX idx_email ON musicians(email);
CREATE INDEX idx_instrumento ON musicians(instrumento);
CREATE INDEX idx_fecha_registro ON musicians(fecha_registro);

-- Configurar RLS (Row Level Security)
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read musicians"
  ON musicians FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert musicians"
  ON musicians FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND 
              (SELECT role FROM musicians WHERE id = auth.uid()) = 'admin');
```

## Testing en Staging

### 1. Ambiente de Staging

```bash
# Crear rama de staging
git checkout -b staging

# Crear archivo .env.staging
cp .env.example .env.staging

# Configurar con credenciales de staging
VITE_DB_TYPE=firebase
VITE_FIREBASE_API_KEY=staging_api_key
# ... resto de credenciales
```

### 2. Desplegar a Staging

```bash
# Compilar para staging
npm run build -- --mode staging

# Desplegar a servidor de staging
# (Depende de tu infraestructura)
```

### 3. Testing en Staging

#### Tests Funcionales

- [ ] Registrar nuevo usuario
- [ ] Crear músico
- [ ] Actualizar músico
- [ ] Eliminar músico
- [ ] Cargar lista de músicos
- [ ] Sincronización offline
- [ ] Recuperación de conexión

#### Tests de Rendimiento

- [ ] Tiempo de carga < 2 segundos
- [ ] Sincronización < 5 segundos
- [ ] Uso de memoria < 50MB
- [ ] Uso de CPU < 20%

#### Tests de Seguridad

- [ ] Contraseñas hasheadas
- [ ] HTTPS en todas las conexiones
- [ ] Validación de inputs
- [ ] No hay credenciales expuestas

#### Tests de Compatibilidad

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile (iOS Safari, Chrome Android)

### 4. Monitoreo en Staging

```bash
# Ver logs
tail -f logs/staging.log

# Ver errores
grep ERROR logs/staging.log

# Ver sincronización
grep SyncManager logs/staging.log

# Exportar logs
npm run export-logs -- staging
```

## Proceso de Deployment

### 1. Preparación

```bash
# Actualizar rama main
git checkout main
git pull origin main

# Crear rama de release
git checkout -b release/v1.0.0

# Actualizar versión
npm version minor

# Compilar para producción
npm run build

# Verificar que no hay errores
npm run test -- --run
```

### 2. Deployment a GitHub Pages

```bash
# Compilar con ruta base correcta
npm run build -- --base /iglesia-worship/

# Desplegar a GitHub Pages
npm run deploy

# Verificar que se desplegó correctamente
# Ir a https://username.github.io/iglesia-worship/
```

### 3. Verificación Post-Deployment

```bash
# Verificar que la aplicación carga
curl -I https://username.github.io/iglesia-worship/

# Verificar que los servicios funcionan
# (Hacer pruebas manuales en navegador)

# Ver logs de errores
# (Abrir DevTools en navegador)
```

### 4. Merge a Main

```bash
# Crear Pull Request
git push origin release/v1.0.0

# Revisar cambios
# Hacer merge a main

# Crear tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Plan de Rollback

### Escenarios de Rollback

#### 1. Error Crítico Inmediato

Si hay error crítico en los primeros 5 minutos:

```bash
# Revertir a versión anterior
git revert HEAD

# Compilar versión anterior
npm run build

# Desplegar versión anterior
npm run deploy

# Notificar al equipo
# Investigar causa del error
```

#### 2. Error Detectado en Testing

Si se detecta error durante testing:

```bash
# Volver a rama anterior
git checkout main

# Compilar versión anterior
npm run build

# Desplegar versión anterior
npm run deploy

# Crear issue para investigar
# Hacer fix en rama de feature
# Hacer testing completo nuevamente
```

#### 3. Error de Datos

Si hay corrupción de datos:

```bash
# Detener sincronización
# (Desactivar SyncManager)

# Restaurar backup de BD
# (Desde Firebase/Supabase console)

# Limpiar localStorage en clientes
# (Notificar a usuarios)

# Investigar causa
# Hacer fix
# Desplegar versión corregida
```

### Procedimiento de Rollback

```bash
# 1. Identificar versión anterior estable
git log --oneline | head -5

# 2. Revertir a versión anterior
git revert <commit-hash>

# 3. Compilar
npm run build

# 4. Desplegar
npm run deploy

# 5. Verificar
# Hacer pruebas manuales

# 6. Notificar
# Enviar mensaje al equipo

# 7. Investigar
# Crear issue
# Hacer fix
# Testing completo
```

### Backup y Recuperación

#### Backup de BD

```bash
# Firebase
# En Firebase Console → Realtime Database → Backup
# Crear backup manual antes de deployment

# Supabase
# En Supabase Dashboard → Backups
# Crear backup manual antes de deployment
```

#### Restaurar desde Backup

```bash
# Firebase
# En Firebase Console → Backups
# Seleccionar backup
# Hacer restore

# Supabase
# En Supabase Dashboard → Backups
# Seleccionar backup
# Hacer restore
```

## Post-Deployment

### 1. Monitoreo Inmediato (Primeras 24 horas)

- [ ] Verificar que no hay errores en logs
- [ ] Verificar que sincronización funciona
- [ ] Verificar que usuarios pueden registrarse
- [ ] Verificar que usuarios pueden crear músicos
- [ ] Monitorear performance
- [ ] Monitorear uso de recursos

### 2. Comunicación

```
Mensaje a usuarios:
"Se ha actualizado la aplicación Worship con mejoras en la base de datos.
Si experimenta problemas, por favor contacte al administrador."
```

### 3. Documentación

- [ ] Actualizar changelog
- [ ] Documentar cambios
- [ ] Documentar issues encontrados
- [ ] Documentar soluciones aplicadas

### 4. Análisis

```bash
# Analizar logs
npm run analyze-logs -- production

# Generar reporte
npm run generate-report -- deployment

# Enviar reporte al equipo
```

## Checklist

### Pre-Deployment

- [ ] Código revisado
- [ ] Tests pasando
- [ ] Seguridad verificada
- [ ] Documentación completa
- [ ] Credenciales configuradas
- [ ] Backup de BD creado
- [ ] Plan de rollback listo

### Deployment

- [ ] Rama de release creada
- [ ] Versión actualizada
- [ ] Build compilado
- [ ] Despliegue exitoso
- [ ] Verificación post-deployment
- [ ] Merge a main
- [ ] Tag creado

### Post-Deployment

- [ ] Monitoreo activo
- [ ] Usuarios notificados
- [ ] Logs analizados
- [ ] Reporte generado
- [ ] Issues documentados
- [ ] Lecciones aprendidas

## Contactos de Emergencia

En caso de emergencia durante deployment:

- **Administrador:** [email/teléfono]
- **Desarrollador Principal:** [email/teléfono]
- **Soporte Técnico:** [email/teléfono]

## Recursos Adicionales

- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
- [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
