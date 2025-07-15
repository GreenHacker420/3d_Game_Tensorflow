import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
