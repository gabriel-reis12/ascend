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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor-react'
          }
          if (id.includes('src/lib/uiEnglish') || id.includes('src/lib/uiTranslations')) {
            return 'i18n-dictionary'
          }
        },
      },
    },
  },
})
