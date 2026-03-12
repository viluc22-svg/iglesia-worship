# Chatbot Worship - Guía de Troubleshooting

## Tabla de Contenidos

1. [Problemas Comunes](#problemas-comunes)
2. [Soluciones Rápidas](#soluciones-rápidas)
3. [Problemas de Conectividad](#problemas-de-conectividad)
4. [Problemas de Rendimiento](#problemas-de-rendimiento)
5. [Problemas de Interfaz](#problemas-de-interfaz)
6. [Problemas de Reconocimiento](#problemas-de-reconocimiento)
7. [Problemas de Accesibilidad](#problemas-de-accesibilidad)
8. [Modo de Depuración](#modo-de-depuración)
9. [Cómo Reportar Bugs](#cómo-reportar-bugs)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Problemas Comunes

### El Chatbot No Aparece

**Síntomas:**
- No ves el botón flotante de chat en la esquina inferior derecha
- El chatbot no se abre cuando haces clic

**Causas Posibles:**
1. JavaScript está deshabilitado en tu navegador
2. El navegador no es compatible
3. Hay un conflicto con otra extensión
4. La página no ha cargado completamente

**Soluciones:**

1. **Habilitar JavaScript:**
   - Chrome: Configuración → Privacidad y seguridad → Configuración de sitios → JavaScript
   - Firefox: about:config → javascript.enabled = true
   - Safari: Preferencias → Seguridad → Habilitar JavaScript

2. **Actualizar el navegador:**
   - Asegúrate de tener la última versión
   - Chrome, Firefox, Safari y Edge son soportados

3. **Desactivar extensiones:**
   - Intenta desactivar extensiones del navegador
   - Abre el chatbot en modo incógnito/privado

4. **Recargar la página:**
   - Presiona F5 o Ctrl+R (Cmd+R en Mac)
   - Espera a que la página cargue completamente

---

### El Chatbot No Responde

**Síntomas:**
- Escribes una pregunta pero no recibes respuesta
- El indicador de carga no desaparece
- El chatbot parece congelado

**Causas Posibles:**
1. Conexión a internet lenta o interrumpida
2. Servidor no responde
3. Navegador tiene problemas
4. Hay demasiados mensajes en el historial

**Soluciones:**

1. **Verificar conexión a internet:**
   - Abre otra página web para confirmar que tienes conexión
   - Si no tienes conexión, el chatbot no funcionará

2. **Esperar un momento:**
   - A veces el servidor tarda en responder
   - Espera 5-10 segundos antes de intentar de nuevo

3. **Recargar la página:**
   - Presiona F5 o Ctrl+R
   - Intenta hacer la pregunta de nuevo

4. **Limpiar el historial:**
   - Cierra el chatbot (botón X)
   - Reabre el chatbot
   - Intenta de nuevo

5. **Limpiar caché del navegador:**
   - Chrome: Configuración → Privacidad y seguridad → Borrar datos de navegación
   - Firefox: Preferencias → Privacidad → Historial → Limpiar historial
   - Safari: Historial → Borrar historial

---

### El Chatbot Da Respuestas Incorrectas

**Síntomas:**
- El chatbot no entiende tu pregunta
- La respuesta no es relevante
- El chatbot dice que no tiene información

**Causas Posibles:**
1. La pregunta es ambigua o poco clara
2. Usas palabras que el chatbot no reconoce
3. La pregunta está fuera del alcance del chatbot
4. Hay un error en la base de conocimiento

**Soluciones:**

1. **Reformular la pregunta:**
   - Sé más específico
   - Usa palabras clave claras
   - Evita jerga o abreviaturas

   **Ejemplo:**
   - ❌ "¿Cómo cambio el audio?"
   - ✅ "¿Cómo cambio el volumen del micrófono?"

2. **Usar sugerencias rápidas:**
   - Las sugerencias rápidas son preguntas que el chatbot entiende bien
   - Úsalas como referencia para formular tu pregunta

3. **Proporcionar más contexto:**
   - Menciona qué estás intentando hacer
   - Proporciona detalles específicos

   **Ejemplo:**
   - ❌ "¿Cómo agrego algo?"
   - ✅ "¿Cómo agrego a Juan como violinista?"

4. **Contactar con soporte:**
   - Si el problema persiste, contacta con el equipo de soporte
   - Proporciona la pregunta exacta que causó el problema

---

### El Chatbot Se Congela o Es Lento

**Síntomas:**
- El chatbot tarda mucho en responder
- La interfaz se congela
- El scroll es lento
- Los botones no responden

**Causas Posibles:**
1. Demasiados mensajes en el historial
2. Navegador con poca memoria disponible
3. Conexión a internet lenta
4. Otras aplicaciones usando recursos

**Soluciones:**

1. **Limpiar el historial:**
   - Cierra el chatbot
   - Reabre el chatbot (esto limpia el historial de la sesión)
   - Intenta de nuevo

2. **Cerrar otras pestañas:**
   - Cierra pestañas del navegador que no necesites
   - Esto libera memoria

3. **Reiniciar el navegador:**
   - Cierra completamente el navegador
   - Reabre el navegador
   - Vuelve a la aplicación

4. **Verificar conexión a internet:**
   - Abre speedtest.net para verificar tu velocidad
   - Si es muy lenta, intenta conectarte a una red más rápida

5. **Usar un navegador diferente:**
   - Intenta con Chrome, Firefox o Safari
   - Algunos navegadores funcionan mejor que otros

---

## Soluciones Rápidas

### Reinicio Rápido del Chatbot

Si el chatbot no funciona correctamente:

1. Haz clic en el botón X para cerrar el chatbot
2. Espera 2 segundos
3. Haz clic en el botón flotante para reabrir
4. Intenta de nuevo

### Limpiar Datos Locales

Si el chatbot tiene problemas persistentes:

1. Abre la consola del navegador (F12)
2. Escribe: `localStorage.removeItem('chatbot:preferences')`
3. Presiona Enter
4. Recarga la página (F5)

### Modo Incógnito/Privado

Para descartar problemas de caché:

1. Abre una ventana incógnita/privada
2. Navega a la aplicación
3. Prueba el chatbot
4. Si funciona, el problema es con tu caché

---

## Problemas de Conectividad

### Sin Conexión a Internet

**Síntoma:** El chatbot no funciona en absoluto

**Solución:**
- El chatbot requiere conexión a internet
- Verifica tu conexión WiFi o datos móviles
- Intenta conectarte a una red diferente

### Conexión Lenta

**Síntoma:** El chatbot tarda mucho en responder

**Soluciones:**
1. Verifica tu velocidad de internet (speedtest.net)
2. Acércate al router WiFi
3. Desconecta otros dispositivos de tu red
4. Intenta con datos móviles si tienes WiFi lento

### Servidor No Responde

**Síntoma:** Ves un mensaje de error "Servidor no disponible"

**Soluciones:**
1. Espera unos minutos y intenta de nuevo
2. Recarga la página (F5)
3. Contacta con soporte si el problema persiste

---

## Problemas de Rendimiento

### El Chatbot Es Lento

**Síntomas:**
- Tarda mucho en responder
- La interfaz se congela
- El scroll es lento

**Soluciones:**

1. **Reducir el historial:**
   ```
   Cierra y reabre el chatbot para limpiar el historial
   ```

2. **Liberar memoria:**
   - Cierra otras aplicaciones
   - Cierra otras pestañas del navegador
   - Reinicia el navegador

3. **Verificar recursos del sistema:**
   - Abre el Administrador de tareas (Windows) o Monitor de actividad (Mac)
   - Verifica si hay procesos usando mucha CPU o memoria
   - Cierra procesos innecesarios

4. **Usar un navegador más ligero:**
   - Chrome es generalmente más rápido
   - Firefox es una buena alternativa
   - Safari en Mac es optimizado para el sistema

---

## Problemas de Interfaz

### El Chatbot Se Superpone con Otros Elementos

**Síntoma:** El chatbot cubre botones u otros elementos importantes

**Soluciones:**
1. Minimiza el chatbot (botón de minimizar)
2. Mueve el chatbot a una posición diferente (si es posible)
3. Cierra el chatbot cuando no lo necesites

### El Texto Es Demasiado Pequeño

**Síntoma:** No puedes leer el texto del chatbot

**Soluciones:**
1. Aumenta el zoom del navegador: Ctrl + + (o Cmd + +)
2. Aumenta el tamaño del texto en la configuración del navegador
3. Usa un navegador con mejor soporte de zoom

### El Chatbot No Se Ve Bien en Móvil

**Síntoma:** El chatbot se ve distorsionado o cortado en el teléfono

**Soluciones:**
1. Gira el teléfono a orientación horizontal
2. Actualiza el navegador a la última versión
3. Intenta con un navegador diferente
4. Contacta con soporte si el problema persiste

---

## Problemas de Reconocimiento

### El Chatbot No Entiende Mis Preguntas

**Síntoma:** El chatbot dice "No estoy seguro de lo que preguntas"

**Soluciones:**

1. **Sé más específico:**
   - ❌ "¿Cómo cambio algo?"
   - ✅ "¿Cómo cambio el volumen?"

2. **Usa palabras clave:**
   - Menciona la acción: agregar, editar, eliminar, etc.
   - Menciona el objeto: músico, servicio, audio, etc.

3. **Evita jerga:**
   - Usa términos comunes
   - Evita abreviaturas

4. **Usa sugerencias rápidas:**
   - Las sugerencias son preguntas que el chatbot entiende
   - Úsalas como referencia

5. **Reformula la pregunta:**
   - Intenta diferentes palabras
   - Intenta diferentes órdenes de palabras

### El Chatbot Reconoce la Intención Incorrecta

**Síntoma:** El chatbot entiende tu pregunta pero da la respuesta equivocada

**Soluciones:**
1. Reformula la pregunta de forma más clara
2. Proporciona más contexto
3. Contacta con soporte para reportar el error

---

## Problemas de Accesibilidad

### No Puedo Navegar con Teclado

**Síntoma:** Tab no funciona o los elementos no se enfocan

**Soluciones:**
1. Verifica que el chatbot esté abierto
2. Presiona Tab para navegar entre elementos
3. Presiona Enter para activar un elemento
4. Presiona Escape para cerrar el chatbot

### El Lector de Pantalla No Funciona

**Síntoma:** El lector de pantalla no lee el contenido del chatbot

**Soluciones:**
1. Verifica que el lector de pantalla esté habilitado
2. Recarga la página
3. Intenta con un lector de pantalla diferente
4. Contacta con soporte

### Los Colores No Tienen Suficiente Contraste

**Síntoma:** El texto es difícil de leer

**Soluciones:**
1. Aumenta el zoom del navegador
2. Usa el modo de alto contraste del sistema operativo
3. Contacta con soporte

---

## Modo de Depuración

### Abrir la Consola del Navegador

Para ver mensajes de error y depuración:

**Chrome/Firefox/Edge:**
1. Presiona F12
2. Haz clic en la pestaña "Console"

**Safari:**
1. Preferencias → Avanzado → Mostrar menú Desarrollo
2. Desarrollo → Mostrar consola web

### Ver Logs del Chatbot

En la consola, escribe:
```javascript
// Ver estado actual del chatbot
console.log(localStorage.getItem('chatbot:preferences'));

// Ver historial de mensajes
console.log(sessionStorage.getItem('chatbot:history'));
```

### Limpiar Datos de Depuración

```javascript
// Limpiar preferencias
localStorage.removeItem('chatbot:preferences');

// Limpiar historial
sessionStorage.removeItem('chatbot:history');

// Recargar página
location.reload();
```

---

## Cómo Reportar Bugs

### Información Necesaria

Cuando reportes un bug, incluye:

1. **Descripción del problema:**
   - Qué sucedió
   - Qué esperabas que sucediera
   - Cuándo sucedió

2. **Pasos para reproducir:**
   - Paso 1: ...
   - Paso 2: ...
   - Paso 3: ...

3. **Información del sistema:**
   - Navegador: Chrome, Firefox, Safari, Edge
   - Versión del navegador
   - Sistema operativo: Windows, Mac, Linux
   - Dispositivo: Desktop, Tablet, Móvil

4. **Captura de pantalla:**
   - Si es posible, adjunta una captura de pantalla
   - Marca el área problemática

5. **Consola de errores:**
   - Abre F12 y copia cualquier mensaje de error
   - Adjunta los errores al reporte

### Plantilla de Reporte

```
Título: [Descripción breve del problema]

Descripción:
[Descripción detallada]

Pasos para reproducir:
1. ...
2. ...
3. ...

Resultado esperado:
[Qué debería suceder]

Resultado actual:
[Qué sucede en su lugar]

Información del sistema:
- Navegador: [Chrome/Firefox/Safari/Edge]
- Versión: [Versión del navegador]
- SO: [Windows/Mac/Linux]
- Dispositivo: [Desktop/Tablet/Móvil]

Captura de pantalla:
[Adjunta si es posible]

Errores de consola:
[Copia de F12 Console si hay errores]
```

### Dónde Reportar

- **Email:** support@iglesia-worship.com
- **Teléfono:** +1 (555) 123-4567
- **Chat en vivo:** Disponible en la aplicación (horario de oficina)
- **Sistema de tickets:** [URL del sistema de tickets]

---

## Preguntas Frecuentes

### ¿Por qué el chatbot no entiende mi pregunta?

El chatbot usa reconocimiento de patrones, no inteligencia artificial completa. Funciona mejor con preguntas claras y específicas. Intenta reformular tu pregunta o usar sugerencias rápidas.

### ¿Mis datos están seguros?

Sí. El chatbot no accede a datos personales sensibles. Solo usa información necesaria para proporcionar ayuda. Tus datos están protegidos según las políticas de privacidad de la aplicación.

### ¿Puedo usar el chatbot sin conexión?

No. El chatbot requiere conexión a internet para funcionar.

### ¿El chatbot puede hacer cambios en mi cuenta?

No. El chatbot solo proporciona información y orientación. No puede hacer cambios en tu cuenta.

### ¿Qué hago si el chatbot da una respuesta incorrecta?

1. Reformula tu pregunta
2. Usa una sugerencia rápida diferente
3. Contacta con soporte

### ¿El chatbot está disponible 24/7?

Sí, el chatbot está disponible en cualquier momento. Sin embargo, el soporte por chat en vivo solo está disponible durante horario de oficina.

### ¿Puedo desactivar el chatbot?

El chatbot está siempre disponible, pero puedes minimizarlo o cerrarlo cuando no lo necesites.

### ¿Cómo puedo dar feedback sobre el chatbot?

Puedes enviar feedback a support@iglesia-worship.com. Tu feedback nos ayuda a mejorar el chatbot.

### ¿El chatbot está disponible en otros idiomas?

Actualmente, el chatbot está disponible en español. Se están considerando otros idiomas para futuras versiones.

### ¿Cómo puedo aprender más sobre el chatbot?

Consulta la [Guía de Uso](./USER_GUIDE.md) o la [Documentación Técnica](./TECHNICAL_DOCUMENTATION.md).

---

## Contacto y Soporte

Si tienes problemas que no se resuelven con esta guía:

- **Email:** support@iglesia-worship.com
- **Teléfono:** +1 (555) 123-4567
- **Chat en vivo:** Disponible en la aplicación (horario de oficina)
- **Documentación:** [Guía de Uso](./USER_GUIDE.md)

Estamos aquí para ayudarte. ¡No dudes en contactarnos!

