import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const keyPath = path.resolve('./127.0.0.1-key.pem')
const certPath = path.resolve('./127.0.0.1.pem')
const hasHttps =
  fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    ...(hasHttps && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
  },
})
