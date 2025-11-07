// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/fca': {
        target: 'https://api.freecryptoapi.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/fca/, ''), // /fca/v1/... → /v1/...
      },
    },
  },
})
