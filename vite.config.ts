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
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'deck-gl-core': ['@deck.gl/core'],
          'deck-gl-layers': ['@deck.gl/layers', '@deck.gl/react'],
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three'],
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    sourcemap: false, // Disable sourcemaps in production for smaller build
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