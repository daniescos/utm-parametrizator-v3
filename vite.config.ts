import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site serves this app under /utm-parametrizator-v3/,
  // not the domain root, so every built asset path needs that prefix.
  base: '/utm-parametrizator-v3/',
  server: {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
    }
  }
})
