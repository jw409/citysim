import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/citysim/',
  optimizeDeps: {
    include: [
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/react'
    ]
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  define: {
    // Fix for deck.gl in production
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})