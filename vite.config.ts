import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/react']
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})