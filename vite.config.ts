import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const appVersion = process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version || 'dev'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
