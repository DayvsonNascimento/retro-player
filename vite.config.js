import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    https: {
      key: fs.readFileSync('./127.0.0.1-key.pem'),
      cert: fs.readFileSync('./127.0.0.1.pem'),
    },
  },
})
