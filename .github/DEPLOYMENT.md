# Guía de Despliegue a GitHub Pages

Esta guía explica cómo configurar y verificar el despliegue automático de la aplicación Worship a GitHub Pages.

## Requisitos Previos

- Repositorio público en GitHub (o GitHub Pro/Enterprise para repositorios privados)
- Permisos de administrador en el repositorio
- El workflow de GitHub Actions ya está configurado en `.github/workflows/deploy.yml`

## Configuración Inicial de GitHub Pages

### Paso 1: Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, haz clic en **Pages**
4. En la sección **Source** (Origen):
   - Selecciona **Deploy from a branch** (Desplegar desde una rama)
   - En **Branch**, selecciona `gh-pages` y `/ (root)`
   - Haz clic en **Save** (Guardar)

### Paso 2: Configurar Permisos de GitHub Actions

Para que el workflow pueda desplegar automáticamente, necesita permisos de escritura:

1. Ve a **Settings** → **Actions** → **General**
2. Desplázate hasta **Workflow permissions**
3. Selecciona **Read and write permissions** (Permisos de lectura y escritura)
4. Marca la casilla **Allow GitHub Actions to create and approve pull requests**
5. Haz clic en **Save** (Guardar)

### Paso 3: Realizar el Primer Despliegue

1. Asegúrate de que todos tus cambios están commiteados
2. Haz push a la rama `main`:
   ```bash
   git push origin main
   ```
3. El workflow se ejecutará automáticamente

## Verificación del Despliegue

### Verificar el Workflow

1. Ve a la pestaña **Actions** en tu repositorio
2. Deberías ver un workflow en ejecución llamado "Deploy to GitHub Pages"
3. Haz clic en el workflow para ver los detalles
4. Espera a que todos los pasos se completen (generalmente 2-5 minutos)
5. El workflow debe mostrar un ✓ verde cuando se complete exitosamente

### Verificar el Sitio Desplegado

1. Una vez que el workflow se complete, espera 1-2 minutos adicionales
2. Ve a **Settings** → **Pages**
3. Verás un mensaje: "Your site is live at https://[tu-usuario].github.io/iglesia-worship/"
4. Haz clic en el enlace o visita la URL directamente
5. Verifica que:
   - El sitio carga correctamente
   - No hay errores 404 en la consola del navegador (F12 → Console)
   - Todos los estilos y funcionalidades funcionan correctamente

### Verificación Local Antes de Desplegar

Para probar el build localmente antes de hacer push:

```bash
# Ejecutar el build
npm run build

# Previsualizar el sitio (simula el entorno de producción)
npm run preview
```

Luego abre http://localhost:4173/iglesia-worship/ en tu navegador y verifica que todo funciona correctamente.

## Flujo de Trabajo de Despliegue

Cada vez que hagas push a la rama `main`, el siguiente proceso ocurre automáticamente:

1. **GitHub Actions detecta el cambio** → El workflow se activa
2. **Checkout del código** → Descarga el código del repositorio
3. **Configuración de Node.js** → Instala Node.js 20.x con caché de npm
4. **Instalación de dependencias** → Ejecuta `npm ci`
5. **Build del proyecto** → Ejecuta `npm run build` (TypeScript + Vite)
6. **Despliegue** → Publica el contenido de `dist/` a la rama `gh-pages`
7. **GitHub Pages actualiza** → El sitio se actualiza automáticamente

**Tiempo estimado**: 2-5 minutos para el primer despliegue, 1-2 minutos para despliegues subsecuentes (gracias al caché).

## Troubleshooting (Solución de Problemas)

### El workflow falla en el paso de deployment

**Síntoma**: El workflow se ejecuta pero falla en "Deploy to GitHub Pages"

**Causas posibles**:
- Permisos insuficientes de GitHub Actions
- Rama `gh-pages` protegida con branch protection rules

**Solución**:
1. Verifica los permisos en **Settings** → **Actions** → **General** → **Workflow permissions**
2. Asegúrate de que "Read and write permissions" está seleccionado
3. Si la rama `gh-pages` tiene branch protection, desactívala temporalmente
4. Re-ejecuta el workflow fallido desde la pestaña **Actions**

### El sitio muestra errores 404 para assets (CSS, JS, imágenes)

**Síntoma**: El sitio carga pero sin estilos, o con errores en la consola

**Causas posibles**:
- El `base` path en `vite.config.ts` no está configurado correctamente
- Los assets no se generaron correctamente durante el build

**Solución**:
1. Verifica que `vite.config.ts` contiene:
   ```typescript
   base: '/iglesia-worship/'
   ```
2. Ejecuta `npm run build` localmente y verifica que `dist/index.html` contiene rutas como:
   ```html
   <script type="module" crossorigin src="/iglesia-worship/assets/...">
   ```
3. Si el problema persiste, limpia y reconstruye:
   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```
4. Haz push de los cambios

### El workflow falla en el paso de build

**Síntoma**: El workflow falla en "Build project" con errores de TypeScript o Vite

**Causas posibles**:
- Errores de compilación de TypeScript
- Dependencias faltantes o incompatibles
- Errores de sintaxis en el código

**Solución**:
1. Ejecuta `npm run build` localmente para ver el error completo
2. Corrige los errores de TypeScript o sintaxis
3. Verifica que todas las dependencias están en `package.json`
4. Asegúrate de que `package-lock.json` está commiteado
5. Haz push de las correcciones

### GitHub Pages no se actualiza después del despliegue

**Síntoma**: El workflow se completa exitosamente pero el sitio no cambia

**Causas posibles**:
- Caché del navegador
- Delay de propagación de GitHub Pages (normal)

**Solución**:
1. Espera 2-3 minutos adicionales (GitHub Pages tiene un pequeño delay)
2. Limpia el caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
3. Verifica en **Settings** → **Pages** que la configuración es correcta
4. Verifica que la rama `gh-pages` se actualizó:
   - Ve a la pestaña **Code** → cambiar a rama `gh-pages`
   - Verifica la fecha del último commit

### El sitio muestra "404 - File not found" de GitHub

**Síntoma**: La URL del sitio muestra una página 404 de GitHub

**Causas posibles**:
- GitHub Pages no está habilitado
- El repositorio es privado y no tienes GitHub Pro
- La rama `gh-pages` no existe o está vacía

**Solución**:
1. Verifica que el repositorio es público (o tienes GitHub Pro para privados)
2. Ve a **Settings** → **Pages** y confirma que está habilitado
3. Verifica que la rama `gh-pages` existe y tiene contenido
4. Espera 5-10 minutos después del primer despliegue (puede tardar más la primera vez)

### El workflow no se ejecuta automáticamente

**Síntoma**: Haces push a `main` pero el workflow no se activa

**Causas posibles**:
- GitHub Actions deshabilitado en el repositorio
- El archivo workflow tiene errores de sintaxis YAML

**Solución**:
1. Ve a **Settings** → **Actions** → **General**
2. Asegúrate de que "Allow all actions and reusable workflows" está seleccionado
3. Verifica que el archivo `.github/workflows/deploy.yml` existe y es válido
4. Puedes ejecutar el workflow manualmente desde **Actions** → "Deploy to GitHub Pages" → **Run workflow**

### Errores de dependencias durante la instalación

**Síntoma**: El workflow falla en "Install dependencies" con errores de npm

**Causas posibles**:
- `package-lock.json` desactualizado o corrupto
- Dependencias incompatibles

**Solución**:
1. Localmente, elimina `node_modules` y `package-lock.json`
2. Ejecuta `npm install` para regenerar el lock file
3. Verifica que el build funciona: `npm run build`
4. Commitea el nuevo `package-lock.json`
5. Haz push de los cambios

## Comandos Útiles

### Ver logs del workflow (usando GitHub CLI)

```bash
# Listar workflows recientes
gh run list

# Ver detalles de un workflow específico
gh run view [run-id]

# Ver logs de un workflow
gh run view [run-id] --log
```

### Build y preview local

```bash
# Build de producción
npm run build

# Preview del build (simula GitHub Pages)
npm run preview

# Limpiar build anterior
rm -rf dist
```

### Verificar configuración de Vite

```bash
# Ver la configuración de Vite
cat vite.config.ts | grep base
```

## Despliegues Subsecuentes

Una vez configurado, los despliegues futuros son completamente automáticos:

1. Haz cambios en tu código
2. Commitea los cambios: `git commit -am "Descripción del cambio"`
3. Haz push: `git push origin main`
4. El sitio se actualizará automáticamente en 1-2 minutos

No necesitas hacer nada más. Puedes monitorear el progreso en la pestaña **Actions**.

## Rollback (Revertir a una Versión Anterior)

Si necesitas revertir a una versión anterior del sitio:

### Opción 1: Revertir el commit

```bash
# Ver historial de commits
git log --oneline

# Revertir al commit anterior
git revert [commit-hash]

# Push del revert
git push origin main
```

El workflow se ejecutará automáticamente y desplegará la versión revertida.

### Opción 2: Desplegar una versión específica manualmente

```bash
# Checkout del commit específico
git checkout [commit-hash]

# Crear una nueva rama
git checkout -b hotfix

# Push de la rama
git push origin hotfix

# Hacer merge a main
git checkout main
git merge hotfix
git push origin main
```

## Monitoreo y Mantenimiento

### Verificar el estado del sitio

- **URL del sitio**: https://[tu-usuario].github.io/iglesia-worship/
- **Estado de workflows**: https://github.com/[tu-usuario]/iglesia-worship/actions
- **Configuración de Pages**: https://github.com/[tu-usuario]/iglesia-worship/settings/pages

### Notificaciones

GitHub enviará notificaciones por email si un workflow falla. Puedes configurar las notificaciones en:
- **Settings** (tu perfil) → **Notifications** → **Actions**

### Logs y Debugging

Todos los logs de los workflows están disponibles en la pestaña **Actions** por 90 días. Puedes:
- Ver logs detallados de cada paso
- Descargar logs completos
- Re-ejecutar workflows fallidos

## Recursos Adicionales

- [Documentación de GitHub Actions](https://docs.github.com/en/actions)
- [Documentación de GitHub Pages](https://docs.github.com/en/pages)
- [Guía de Despliegue de Vite](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)

## Soporte

Si encuentras problemas no cubiertos en esta guía:

1. Revisa los logs del workflow en la pestaña **Actions**
2. Verifica la configuración en **Settings** → **Pages**
3. Consulta la documentación oficial de GitHub Pages
4. Abre un issue en el repositorio con los detalles del error
