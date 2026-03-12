# Guía de Monitoreo - Integración de Base de Datos

## Tabla de Contenidos

1. [Métricas Clave](#métricas-clave)
2. [Configuración de Alertas](#configuración-de-alertas)
3. [Monitoreo de BD](#monitoreo-de-bd)
4. [Monitoreo de Performance](#monitoreo-de-performance)
5. [Monitoreo de Sincronización](#monitoreo-de-sincronización)
6. [Análisis de Logs](#análisis-de-logs)
7. [Dashboards](#dashboards)
8. [Reportes](#reportes)

## Métricas Clave

### 1. Disponibilidad

**Métrica:** Porcentaje de tiempo que BD está disponible

```typescript
// Calcular disponibilidad
const logs = Logger.getLogs();
const connectionErrors = logs.filter(l => 
  l.context === 'ConnectionManager' && l.level === 'error'
);
const availability = ((logs.length - connectionErrors.length) / logs.length) * 100;
console.log(`Disponibilidad: ${availability.toFixed(2)}%`);
```

**Objetivo:** > 99.9%

**Alerta:** < 99%

### 2. Tiempo de Respuesta

**Métrica:** Tiempo promedio de respuesta de BD

```typescript
// Medir tiempo de respuesta
const start = Date.now();
const musicians = await DatabaseService.getInstance().getMusicians();
const responseTime = Date.now() - start;
console.log(`Tiempo de respuesta: ${responseTime}ms`);
```

**Objetivo:** < 500ms

**Alerta:** > 2000ms

### 3. Tasa de Errores

**Métrica:** Porcentaje de operaciones que fallan

```typescript
// Calcular tasa de errores
const logs = Logger.getLogs();
const errors = logs.filter(l => l.level === 'error');
const errorRate = (errors.length / logs.length) * 100;
console.log(`Tasa de errores: ${errorRate.toFixed(2)}%`);
```

**Objetivo:** < 0.1%

**Alerta:** > 1%

### 4. Cambios Pendientes

**Métrica:** Número de cambios sin sincronizar

```typescript
// Contar cambios pendientes
const pending = LocalStorageService.getInstance().getPendingChanges();
console.log(`Cambios pendientes: ${pending.length}`);
```

**Objetivo:** 0

**Alerta:** > 100

### 5. Tamaño de Caché

**Métrica:** Tamaño de datos en localStorage

```typescript
// Calcular tamaño de caché
const musicians = LocalStorageService.getInstance().getMusicians();
const size = JSON.stringify(musicians).length;
console.log(`Tamaño de caché: ${(size / 1024).toFixed(2)}KB`);
```

**Objetivo:** < 1MB

**Alerta:** > 4MB

### 6. Conflictos de Sincronización

**Métrica:** Número de conflictos resueltos

```typescript
// Contar conflictos
const logs = Logger.getLogsByContext('SyncManager');
const conflicts = logs.filter(l => l.message.includes('conflict'));
console.log(`Conflictos: ${conflicts.length}`);
```

**Objetivo:** 0

**Alerta:** > 10

## Configuración de Alertas

### 1. Alerta de Conexión Perdida

```typescript
import { ConnectionManager } from './services/database/ConnectionManager';

const connManager = ConnectionManager.getInstance();

connManager.onConnectionChange((connected) => {
  if (!connected) {
    // Enviar alerta
    sendAlert({
      level: 'critical',
      message: 'Conexión a BD perdida',
      timestamp: new Date(),
    });
    
    // Notificar usuario
    showNotification('Conexión perdida. Usando datos locales.');
  } else {
    // Conexión recuperada
    sendAlert({
      level: 'info',
      message: 'Conexión a BD recuperada',
      timestamp: new Date(),
    });
  }
});
```

### 2. Alerta de Cambios Pendientes

```typescript
// Verificar cada 5 minutos
setInterval(() => {
  const pending = LocalStorageService.getInstance().getPendingChanges();
  
  if (pending.length > 100) {
    sendAlert({
      level: 'warning',
      message: `${pending.length} cambios pendientes sin sincronizar`,
      timestamp: new Date(),
    });
  }
}, 5 * 60 * 1000);
```

### 3. Alerta de Errores

```typescript
import { ErrorHandler } from './services/database/ErrorHandler';

const errorHandler = ErrorHandler.getInstance();

errorHandler.onError((notification) => {
  if (notification.type === 'error') {
    sendAlert({
      level: 'error',
      message: notification.message,
      timestamp: new Date(),
      context: notification.context,
    });
  }
});
```

### 4. Alerta de Performance

```typescript
// Monitorear tiempo de respuesta
const start = Date.now();
const result = await DatabaseService.getInstance().getMusicians();
const responseTime = Date.now() - start;

if (responseTime > 2000) {
  sendAlert({
    level: 'warning',
    message: `Tiempo de respuesta lento: ${responseTime}ms`,
    timestamp: new Date(),
  });
}
```

## Monitoreo de BD

### 1. Verificar Disponibilidad

```bash
# Para Firebase
curl -I https://your_project.firebaseio.com

# Para Supabase
curl -I https://your_project.supabase.co/rest/v1/musicians
```

### 2. Verificar Datos

```typescript
// Contar músicos
const db = DatabaseService.getInstance();
const musicians = await db.getMusicians();
console.log(`Total de músicos: ${musicians.length}`);

// Verificar integridad
musicians.forEach(m => {
  if (!m.email || !m.nombre || !m.instrumento) {
    console.warn('Datos incompletos:', m);
  }
});
```

### 3. Verificar Índices

```bash
# Firebase Console
# Realtime Database → Indexes
# Verificar que existen:
# - musicians/email
# - musicians/instrumento
# - musicians/fechaRegistro

# Supabase
# Verificar en SQL Editor
SELECT * FROM pg_indexes WHERE tablename = 'musicians';
```

### 4. Verificar Reglas de Seguridad

```bash
# Firebase Console
# Realtime Database → Rules
# Verificar que están configuradas correctamente

# Supabase
# Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'musicians';
```

## Monitoreo de Performance

### 1. Tiempo de Carga

```typescript
// Medir tiempo de carga inicial
const start = performance.now();
await initializeDatabaseServices();
const loadTime = performance.now() - start;
console.log(`Tiempo de carga: ${loadTime.toFixed(2)}ms`);

// Objetivo: < 3000ms
if (loadTime > 3000) {
  console.warn('Carga lenta detectada');
}
```

### 2. Uso de Memoria

```typescript
// Medir uso de memoria
if (performance.memory) {
  const used = performance.memory.usedJSHeapSize / 1048576;
  const limit = performance.memory.jsHeapSizeLimit / 1048576;
  console.log(`Memoria: ${used.toFixed(2)}MB / ${limit.toFixed(2)}MB`);
  
  // Alerta si > 50MB
  if (used > 50) {
    console.warn('Uso alto de memoria');
  }
}
```

### 3. Operaciones Lentas

```typescript
// Registrar operaciones lentas
const slowThreshold = 1000; // 1 segundo

Logger.getLogs().forEach(log => {
  if (log.duration && log.duration > slowThreshold) {
    console.warn(`Operación lenta: ${log.message} (${log.duration}ms)`);
  }
});
```

### 4. Profiling

```typescript
// Usar DevTools Performance API
performance.mark('operation-start');
// ... hacer operación
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');

const measure = performance.getEntriesByName('operation')[0];
console.log(`Duración: ${measure.duration.toFixed(2)}ms`);
```

## Monitoreo de Sincronización

### 1. Estado de Sincronización

```typescript
// Verificar estado
const pending = LocalStorageService.getInstance().getPendingChanges();
const db = DatabaseService.getInstance();

console.log({
  pendingChanges: pending.length,
  isConnected: db.isConnected(),
  lastSync: pending[0]?.timestamp,
});
```

### 2. Cambios Pendientes por Tipo

```typescript
// Agrupar por tipo
const pending = LocalStorageService.getInstance().getPendingChanges();
const byType = {
  create: pending.filter(p => p.type === 'create').length,
  update: pending.filter(p => p.type === 'update').length,
  delete: pending.filter(p => p.type === 'delete').length,
};
console.log('Cambios pendientes por tipo:', byType);
```

### 3. Reintentos Fallidos

```typescript
// Contar reintentos
const pending = LocalStorageService.getInstance().getPendingChanges();
const failedRetries = pending.filter(p => p.retries >= 3);
console.log(`Cambios con reintentos fallidos: ${failedRetries.length}`);

// Mostrar detalles
failedRetries.forEach(p => {
  console.log(`${p.id}: ${p.retries} reintentos`);
});
```

### 4. Conflictos Resueltos

```typescript
// Contar conflictos
const logs = Logger.getLogsByContext('SyncManager');
const conflicts = logs.filter(l => l.message.includes('conflict'));
console.log(`Conflictos resueltos: ${conflicts.length}`);

// Mostrar detalles
conflicts.forEach(log => {
  console.log(`${log.timestamp}: ${log.message}`);
});
```

## Análisis de Logs

### 1. Filtrar por Nivel

```typescript
// Obtener errores
const errors = Logger.getLogsByLevel('error');
console.table(errors);

// Obtener advertencias
const warnings = Logger.getLogsByLevel('warn');
console.table(warnings);

// Obtener info
const info = Logger.getLogsByLevel('info');
console.table(info);
```

### 2. Filtrar por Contexto

```typescript
// Logs de DatabaseService
const dbLogs = Logger.getLogsByContext('DatabaseService');
console.table(dbLogs);

// Logs de SyncManager
const syncLogs = Logger.getLogsByContext('SyncManager');
console.table(syncLogs);

// Logs de ValidationService
const validationLogs = Logger.getLogsByContext('ValidationService');
console.table(validationLogs);
```

### 3. Filtrar por Rango de Tiempo

```typescript
// Logs de última hora
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentLogs = Logger.getLogs().filter(l => 
  new Date(l.timestamp) > oneHourAgo
);
console.table(recentLogs);
```

### 4. Exportar Logs

```typescript
// Exportar como JSON
const json = Logger.exportLogs();
console.log(json);

// Exportar como CSV
const csv = Logger.exportLogsAsCSV();
console.log(csv);

// Guardar en archivo
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `logs-${new Date().toISOString()}.json`;
a.click();
```

## Dashboards

### 1. Dashboard de Disponibilidad

```html
<div class="dashboard">
  <h2>Disponibilidad</h2>
  <div class="metric">
    <span class="label">Disponibilidad:</span>
    <span class="value" id="availability">--</span>
  </div>
  <div class="metric">
    <span class="label">Conexión:</span>
    <span class="value" id="connection">--</span>
  </div>
  <div class="metric">
    <span class="label">Errores (24h):</span>
    <span class="value" id="errors">--</span>
  </div>
</div>

<script>
// Actualizar cada 30 segundos
setInterval(() => {
  const logs = Logger.getLogs();
  const errors = logs.filter(l => l.level === 'error');
  const availability = ((logs.length - errors.length) / logs.length * 100).toFixed(2);
  
  document.getElementById('availability').textContent = `${availability}%`;
  document.getElementById('connection').textContent = 
    DatabaseService.getInstance().isConnected() ? 'Conectado' : 'Desconectado';
  document.getElementById('errors').textContent = errors.length;
}, 30000);
</script>
```

### 2. Dashboard de Performance

```html
<div class="dashboard">
  <h2>Performance</h2>
  <div class="metric">
    <span class="label">Tiempo de respuesta:</span>
    <span class="value" id="response-time">--</span>
  </div>
  <div class="metric">
    <span class="label">Uso de memoria:</span>
    <span class="value" id="memory">--</span>
  </div>
  <div class="metric">
    <span class="label">Cambios pendientes:</span>
    <span class="value" id="pending">--</span>
  </div>
</div>

<script>
// Actualizar cada 30 segundos
setInterval(() => {
  const pending = LocalStorageService.getInstance().getPendingChanges();
  const memory = performance.memory?.usedJSHeapSize / 1048576 || 0;
  
  document.getElementById('pending').textContent = pending.length;
  document.getElementById('memory').textContent = `${memory.toFixed(2)}MB`;
}, 30000);
</script>
```

### 3. Dashboard de Sincronización

```html
<div class="dashboard">
  <h2>Sincronización</h2>
  <div class="metric">
    <span class="label">Cambios pendientes:</span>
    <span class="value" id="pending-count">--</span>
  </div>
  <div class="metric">
    <span class="label">Conflictos:</span>
    <span class="value" id="conflicts">--</span>
  </div>
  <div class="metric">
    <span class="label">Última sincronización:</span>
    <span class="value" id="last-sync">--</span>
  </div>
</div>

<script>
// Actualizar cada 30 segundos
setInterval(() => {
  const pending = LocalStorageService.getInstance().getPendingChanges();
  const logs = Logger.getLogsByContext('SyncManager');
  const conflicts = logs.filter(l => l.message.includes('conflict')).length;
  const lastSync = logs[logs.length - 1]?.timestamp || 'Nunca';
  
  document.getElementById('pending-count').textContent = pending.length;
  document.getElementById('conflicts').textContent = conflicts;
  document.getElementById('last-sync').textContent = lastSync;
}, 30000);
</script>
```

## Reportes

### 1. Reporte Diario

```typescript
// Generar reporte diario
function generateDailyReport() {
  const logs = Logger.getLogs();
  const errors = logs.filter(l => l.level === 'error');
  const warnings = logs.filter(l => l.level === 'warn');
  
  const report = {
    date: new Date().toISOString().split('T')[0],
    totalLogs: logs.length,
    errors: errors.length,
    warnings: warnings.length,
    errorRate: ((errors.length / logs.length) * 100).toFixed(2),
    availability: (((logs.length - errors.length) / logs.length) * 100).toFixed(2),
    pendingChanges: LocalStorageService.getInstance().getPendingChanges().length,
  };
  
  return report;
}

// Enviar reporte
const report = generateDailyReport();
console.log(JSON.stringify(report, null, 2));
```

### 2. Reporte Semanal

```typescript
// Generar reporte semanal
function generateWeeklyReport() {
  const logs = Logger.getLogs();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekLogs = logs.filter(l => new Date(l.timestamp) > oneWeekAgo);
  
  const report = {
    period: 'Last 7 days',
    totalLogs: weekLogs.length,
    errors: weekLogs.filter(l => l.level === 'error').length,
    warnings: weekLogs.filter(l => l.level === 'warn').length,
    byContext: {},
  };
  
  // Agrupar por contexto
  const contexts = new Set(weekLogs.map(l => l.context));
  contexts.forEach(ctx => {
    report.byContext[ctx] = weekLogs.filter(l => l.context === ctx).length;
  });
  
  return report;
}
```

### 3. Reporte de Incidentes

```typescript
// Generar reporte de incidentes
function generateIncidentReport() {
  const logs = Logger.getLogs();
  const errors = logs.filter(l => l.level === 'error');
  
  const report = {
    timestamp: new Date().toISOString(),
    totalIncidents: errors.length,
    incidents: errors.map(e => ({
      timestamp: e.timestamp,
      context: e.context,
      message: e.message,
      severity: 'error',
    })),
  };
  
  return report;
}
```

## Recursos Adicionales

- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
