import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.hdr'],
  build: {
    assetsInlineLimit: 0,
    target: 'esnext'
  },
  server: {
    port: 3002,
    host: true
  },
  optimizeDeps: {
    include: ['@babylonjs/core', '@babylonjs/gui', '@babylonjs/materials']
  }
})
