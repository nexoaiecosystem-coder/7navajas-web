import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = nombre del repo, necesario para GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/7navajas-web/',
})
