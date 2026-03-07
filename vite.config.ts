import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ mode }) => ({
  base: '/iglesia-worship/',
  server: {
    https: mode === 'development',
    host: 'Worship-Adoracion',
    port: 5173,
    strictPort: true
  },
  plugins: [
    mode === 'development' && mkcert({
      hosts: ['localhost', 'Worship-Adoracion']
    })
  ].filter(Boolean)
}))
