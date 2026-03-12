# Guía de Troubleshooting - Integración de Base de Datos

## Tabla de Contenidos

1. [Problemas Comunes](#problemas-comunes)
2. [Errores de Conexión](#errores-de-conexión)
3. [Errores de Validación](#errores-de-validación)
4. [Errores de Sincronización](#errores-de-sincronización)
5. [Problemas de Performance](#problemas-de-performance)
6. [Problemas de Seguridad](#problemas-de-seguridad)
7. [Debugging](#debugging)

## Problemas Comunes

### Problema: La aplicación no carga

**Síntomas:**
- Página en blanco
- Error en consola
- Aplicación no responde

**Soluciones:**

1. **Verificar conexión a internet**
   ```bash
   # Abrir DevTools (F12)
   # Ir a Network tab
   # Verificar que hay conexión
   ```

2. **Verificar variables de entorno**
   ```bash
   # Verificar que .env.local existe
   ls -la .env.local
   
   # Verificar que tiene credenciales
   cat .env.local
   ```

3. **Limpiar caché del navegador**
   ```
   DevTools → Application → Clear site data
   ```

4. **Verificar que BD está disponible**
   ```bash
   # Para Firebase
   curl https://your_project.firebaseio.com/.json
   
   # Para Supabase
   curl https://your_project.supabase.co/rest/v1/musicians
   ```

5. **Ver logs de error**
   ```typescript
   // En consola del navegador
   const logs = Logger.getLogs();
   console.table(logs.filter(l => l.level === 'error'));
   ```

### Problema: No puedo registrar usuario

**Síntomas:**
- Formulario de registro no funciona
- Error al hacer submit
- Usuario no se crea

**Soluciones:**

1. **Verificar validación**
   ```typescript
   // En consola
   const validation = ValidationService.getInstance();
   const result = await validation.validateMusicianComplete({
     email: 'test@example.com',
     nombre: 'Test',
     instrumento: 'Guitarra',
     contraseña: 'password123',
   });
   console.log(result);
   ```

2. **Verificar conexión a BD**
   ```typescript
   const db = DatabaseService.getInstance();
   console.log('Conectado:', db.isConnected());
   ```

3. **Verificar email único**
   ```typescript
   const validation = ValidationService.getInstance();
   const isUnique = await validation.isEmailUnique('test@example.com');
   console.log('Email único:', isUnique);
   ```

4. **Ver logs de error**
   ```typescript
   const logs = Logger.getLogsByContext('Phase4Integration');
   console.table(logs);
   ```

### Problema: Los datos no se guardan

**Síntomas:**
- Datos desaparecen después de recargar
- Cambios no se sincronizan
- localStorage vacío

**Soluciones:**

1. **Verificar localStorage**
   ```typescript
   // En consola
   const localStorage = LocalStorageService.getInstance();
   console.log('Músicos:', localStorage.getMusicians());
   console.log('Cambios pendientes:', localStorage.getPendingChanges());
   ```

2. **Verificar sincronización**
   ```typescript
   const syncManager = SyncManager.getInstance();
   await syncManager.syncPendingChanges();
   console.log('Sincronización completada');
   ```

3. **Verificar permisos de localStorage**
   ```javascript
   try {
     localStorage.setItem('test', 'test');
     localStorage.removeItem('test');
     console.log('localStorage disponible');
   } catch (e) {
     console.error('localStorage no disponible:', e);
   }
   ```

## Errores de Conexión

### Error: "Connection timeout"

**Causa:** BD no responde en tiempo

**Soluciones:**

1. **Verificar que BD está disponible**
   ```bash
   # Para Firebase
   curl -I https://your_project.firebaseio.com
   
   # Para Supabase
   curl -I https://your_project.supabase.co
   ```

2. **Verificar credenciales**
   ```bash
   # Verificar que .env.local tiene credenciales correctas
   cat .env.local | grep FIREBASE
   ```

3. **Aumentar timeout**
   ```typescript
   // En ConnectionManager.ts
   private static readonly TIMEOUT = 15000; // 15 segundos
   ```

4. **Verificar firewall**
   ```bash
   # Verificar que puerto 443 está abierto
   telnet your_project.firebaseio.com 443
   ```

### Error: "Network error"

**Causa:** Problema de red

**Soluciones:**

1. **Verificar conexión a internet**
   ```bash
   ping google.com
   ```

2. **Verificar DNS**
   ```bash
   nslookup your_project.firebaseio.com
   ```

3. **Verificar proxy**
   ```
   Si está detrás de proxy, configurar en .env.local
   VITE_PROXY_URL=http://proxy.example.com:8080
   ```

4. **Verificar CORS**
   ```
   Si error de CORS, verificar configuración en BD
   Firebase: Verificar reglas de seguridad
   Supabase: Verificar CORS settings
   ```

### Error: "Authentication failed"

**Causa:** Credenciales inválidas

**Soluciones:**

1. **Verificar API key**
   ```bash
   # Verificar que API key es correcta
   cat .env.local | grep API_KEY
   ```

2. **Verificar que BD está habilitada**
   ```
   Firebase Console → Realtime Database → Verificar que existe
   Supabase Dashboard → Verificar que proyecto existe
   ```

3. **Regenerar credenciales**
   ```
   Firebase Console → Project Settings → Regenerar API key
   Supabase Dashboard → Settings → API → Regenerar key
   ```

4. **Verificar permisos**
   ```
   Firebase: Verificar reglas de seguridad
   Supabase: Verificar RLS policies
   ```

## Errores de Validación

### Error: "Invalid email"

**Causa:** Email no cumple formato

**Soluciones:**

1. **Verificar formato de email**
   ```typescript
   const validation = ValidationService.getInstance();
   const result = validation.validateEmail('test@example.com');
   console.log(result);
   ```

2. **Verificar regex**
   ```typescript
   // En ValidationService.ts
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   console.log(emailRegex.test('test@example.com'));
   ```

### Error: "Email already exists"

**Causa:** Email ya está registrado

**Soluciones:**

1. **Verificar email en BD**
   ```typescript
   const db = DatabaseService.getInstance();
   const isUnique = await db.isEmailUnique('test@example.com');
   console.log('Email único:', isUnique);
   ```

2. **Usar email diferente**
   ```
   Usar email que no esté registrado
   ```

3. **Recuperar cuenta existente**
   ```
   Si es usuario existente, usar login en lugar de registro
   ```

### Error: "Invalid password"

**Causa:** Contraseña no cumple requisitos

**Soluciones:**

1. **Verificar requisitos**
   ```typescript
   const validation = ValidationService.getInstance();
   const result = validation.validatePassword('password123');
   console.log(result);
   // Requisitos: mínimo 6 caracteres
   ```

2. **Usar contraseña válida**
   ```
   Contraseña debe tener:
   - Mínimo 6 caracteres
   - Puede contener letras, números, símbolos
   ```

### Error: "Invalid instrument"

**Causa:** Instrumento no es válido

**Soluciones:**

1. **Verificar instrumentos válidos**
   ```typescript
   const validation = ValidationService.getInstance();
   const rules = validation.getValidationRules();
   console.log('Instrumentos válidos:', rules.instrument.validValues);
   // Válidos: Guitarra, Piano, Bajo, Batería, Voz, Director
   ```

2. **Usar instrumento válido**
   ```
   Seleccionar de la lista de instrumentos disponibles
   ```

## Errores de Sincronización

### Error: "Sync failed"

**Causa:** Error durante sincronización

**Soluciones:**

1. **Verificar cambios pendientes**
   ```typescript
   const localStorage = LocalStorageService.getInstance();
   const pending = localStorage.getPendingChanges();
   console.log('Cambios pendientes:', pending);
   ```

2. **Forzar sincronización**
   ```typescript
   const syncManager = SyncManager.getInstance();
   await syncManager.syncPendingChanges();
   ```

3. **Ver logs de sincronización**
   ```typescript
   const logs = Logger.getLogsByContext('SyncManager');
   console.table(logs);
   ```

4. **Limpiar cambios pendientes**
   ```typescript
   const localStorage = LocalStorageService.getInstance();
   localStorage.clearPendingChanges();
   ```

### Error: "Conflict detected"

**Causa:** Versiones diferentes en BD y localStorage

**Soluciones:**

1. **Ver conflicto**
   ```typescript
   const logs = Logger.getLogsByContext('SyncManager');
   const conflicts = logs.filter(l => l.message.includes('conflict'));
   console.table(conflicts);
   ```

2. **Resolver conflicto**
   ```
   El sistema resuelve automáticamente usando timestamp más reciente
   Si necesita control manual, contactar administrador
   ```

3. **Limpiar caché**
   ```typescript
   const localStorage = LocalStorageService.getInstance();
   localStorage.clearAll();
   // Recargar datos desde BD
   ```

### Error: "Pending changes not syncing"

**Causa:** Cambios pendientes no se sincronizan

**Soluciones:**

1. **Verificar conexión**
   ```typescript
   const db = DatabaseService.getInstance();
   console.log('Conectado:', db.isConnected());
   ```

2. **Verificar cambios pendientes**
   ```typescript
   const localStorage = LocalStorageService.getInstance();
   const pending = localStorage.getPendingChanges();
   console.log('Cambios pendientes:', pending);
   ```

3. **Forzar sincronización**
   ```typescript
   const syncManager = SyncManager.getInstance();
   await syncManager.syncPendingChanges();
   ```

4. **Verificar reintentos**
   ```typescript
   const pending = localStorage.getPendingChanges();
   pending.forEach(p => {
     console.log(`${p.id}: ${p.retries} reintentos`);
   });
   ```

## Problemas de Performance

### Problema: Aplicación lenta

**Síntomas:**
- Interfaz lenta
- Operaciones tardan mucho
- Uso alto de CPU

**Soluciones:**

1. **Verificar tamaño de caché**
   ```typescript
   const localStorage = LocalStorageService.getInstance();
   const musicians = localStorage.getMusicians();
   console.log(`Músicos en caché: ${musicians.length}`);
   
   // Si > 1000, considerar paginación
   ```

2. **Verificar logs**
   ```typescript
   const logs = Logger.getLogs();
   console.log(`Logs en memoria: ${logs.length}`);
   
   // Si > 1000, limpiar
   Logger.clearLogs();
   ```

3. **Verificar cambios pendientes**
   ```typescript
   const pending = localStorage.getPendingChanges();
   console.log(`Cambios pendientes: ${pending.length}`);
   
   // Si > 100, sincronizar
   ```

4. **Usar DevTools**
   ```
   DevTools → Performance → Record
   Hacer operación
   Analizar timeline
   ```

### Problema: Sincronización lenta

**Síntomas:**
- Sincronización tarda mucho
- Cambios no se aplican rápido

**Soluciones:**

1. **Verificar velocidad de red**
   ```bash
   # Medir latencia
   ping your_project.firebaseio.com
   ```

2. **Verificar tamaño de cambios**
   ```typescript
   const pending = localStorage.getPendingChanges();
   pending.forEach(p => {
     console.log(`${p.id}: ${JSON.stringify(p.data).length} bytes`);
   });
   ```

3. **Aumentar intervalo de sincronización**
   ```typescript
   // En SyncManager.ts
   private static readonly SYNC_INTERVAL = 60000; // 60 segundos
   ```

4. **Usar batch operations**
   ```typescript
   // Agrupar múltiples cambios
   const pending = localStorage.getPendingChanges();
   // Aplicar en batch en lugar de uno por uno
   ```

## Problemas de Seguridad

### Problema: Credenciales expuestas

**Síntomas:**
- Credenciales en código fuente
- Credenciales en git history
- Credenciales en logs

**Soluciones:**

1. **Verificar que no hay credenciales en código**
   ```bash
   grep -r "FIREBASE_API_KEY" src/
   grep -r "SUPABASE_KEY" src/
   ```

2. **Verificar .gitignore**
   ```bash
   cat .gitignore | grep ".env"
   ```

3. **Limpiar git history**
   ```bash
   # Si credenciales fueron commiteadas
   git filter-branch --tree-filter 'rm -f .env.local' HEAD
   git push origin --force --all
   ```

4. **Regenerar credenciales**
   ```
   Firebase Console → Project Settings → Regenerar API key
   Supabase Dashboard → Settings → API → Regenerar key
   ```

### Problema: Contraseñas en texto plano

**Síntomas:**
- Contraseñas visibles en logs
- Contraseñas en localStorage
- Contraseñas en red

**Soluciones:**

1. **Verificar que se hashean**
   ```typescript
   // En DatabaseService.ts
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Verificar que no están en logs**
   ```bash
   grep -r "password" logs/
   ```

3. **Verificar que no están en localStorage**
   ```javascript
   // En consola
   localStorage.getItem('worship_musicians');
   // No debe contener contraseñas
   ```

### Problema: HTTPS no configurado

**Síntomas:**
- Advertencia de seguridad
- Mixed content warning
- Conexión no segura

**Soluciones:**

1. **Verificar que BD usa HTTPS**
   ```typescript
   const url = process.env.VITE_FIREBASE_DATABASE_URL;
   if (!url.startsWith('https://')) {
     throw new Error('Database URL must use HTTPS');
   }
   ```

2. **Verificar certificado SSL**
   ```bash
   openssl s_client -connect your_project.firebaseio.com:443
   ```

3. **Configurar HTTPS en servidor**
   ```
   Si está en servidor propio, configurar SSL certificate
   ```

## Debugging

### Habilitar Logs Detallados

```typescript
// En main.ts
process.env.VITE_LOG_LEVEL = 'debug';

// Ver todos los logs
const logs = Logger.getLogs();
console.table(logs);
```

### Inspeccionar Estado

```typescript
// Estado de servicios
const db = DatabaseService.getInstance();
const localStorage = LocalStorageService.getInstance();
const syncManager = SyncManager.getInstance();
const connManager = ConnectionManager.getInstance();

console.log({
  dbConnected: db.isConnected(),
  cachedMusicians: localStorage.getMusicians().length,
  pendingChanges: localStorage.getPendingChanges().length,
  connConnected: connManager.isConnected(),
});
```

### Exportar Logs

```typescript
// Exportar para análisis
const logs = Logger.getLogs();
const json = JSON.stringify(logs, null, 2);
console.log(json);

// O exportar como CSV
const csv = Logger.exportLogsAsCSV();
console.log(csv);
```

### Usar DevTools

```
1. Abrir DevTools (F12)
2. Ir a Console tab
3. Ejecutar comandos de debugging
4. Ir a Network tab para ver requests
5. Ir a Application tab para ver localStorage
6. Ir a Performance tab para profiling
```

## Contacto de Soporte

Si el problema persiste:

1. Recopilar logs
   ```typescript
   const logs = Logger.exportLogs();
   // Guardar en archivo
   ```

2. Documentar pasos para reproducir

3. Contactar a administrador con:
   - Descripción del problema
   - Pasos para reproducir
   - Logs exportados
   - Navegador y versión
   - Sistema operativo

## Recursos Adicionales

- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
