import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'three'],
          'physics': ['cannon-es', 'cannon-es-debugger'],
          'ui': ['lil-gui', 'gsap']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', 'cannon-es', 'cannon-es-debugger', 'lil-gui', 'gsap']
  }
  base: './',
})
