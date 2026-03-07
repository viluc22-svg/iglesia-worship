import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  base: '/iglesia-worship/', // Necesario para que GitHub Pages cargue los archivos correctamente
  server: {
    https: true,
    host: 'Worship-Adoracion', // Forzamos el nombre que tú quieres
    port: 5173,
    strictPort: true // Si el puerto está ocupado, dará error en vez de cambiarlo
  },
  plugins: [
    mkcert({
      hosts: ['localhost', 'Worship-Adoracion'] // Asegura que el certificado SSL sea válido para el nuevo nombre
    })
  ]
})
