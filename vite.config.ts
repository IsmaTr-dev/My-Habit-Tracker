import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Mis hábitos',
        short_name: 'Mis hábitos',
        description: 'Habit tracker con aspecto de cuaderno',
        lang: 'es',
        theme_color: '#fbf8f1',
        background_color: '#fbf8f1',
        display: 'standalone',
        orientation: 'portrait',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // La fuente se sirve desde la app: entra en el precache y funciona sin conexión desde la primera visita
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
})
