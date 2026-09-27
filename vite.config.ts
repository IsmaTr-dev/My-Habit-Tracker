import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Mis hábitos',
        short_name: 'Mis hábitos',
        description: 'Habit tracker con aspecto de cuaderno',
        lang: 'es',
        theme_color: '#fbf8f1',
        background_color: '#fbf8f1',
        display: 'standalone',
        orientation: 'portrait',
        // PNG: Android y la instalación de Chrome los necesitan; la versión maskable deja margen para el recorte circular
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La fuente se sirve desde la app: entra en el precache y funciona sin conexión desde la primera visita
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Las rutas reservadas de Firebase Hosting (/__/auth/handler del login con Google, /__/firebase/…)
        // tienen que llegar al servidor: si el service worker las responde con index.html, el login no se completa
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
})
