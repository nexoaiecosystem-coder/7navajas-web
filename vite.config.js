import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// con dominio propio (ver CNAME) se sirve desde la raíz, no desde /7navajas-web/
export default defineConfig({
  plugins: [react()],
  base: '/',
})
