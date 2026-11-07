import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    entries: ['index.html', 'moderacion/index.html', 'denuncia/index.html'],
  },
  // Three pages: the app, the moderators' panel and the public page to report a call.
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
        moderacion: 'moderacion/index.html',
        denuncia: 'denuncia/index.html',
      },
    },
  },
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    cors: true,
    watch: {
      ignored: ['**/agentes/**', '**/android/**'],
    },
  },
})
