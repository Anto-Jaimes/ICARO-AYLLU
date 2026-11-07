import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Without this Vite scans every .html in the project, including agentes/ and the
  // copy of the app inside android/, and fails on files that are not part of it.
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    watch: {
      ignored: ['**/agentes/**', '**/android/**'],
    },
  },
})
