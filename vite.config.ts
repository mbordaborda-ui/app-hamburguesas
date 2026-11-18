import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Puerto propio para no chocar con otras apps (Empire Inventori usa 5173).
 * Cambia solo estos dos números si necesitas otro puerto.
 */
export const DEV_PORT = 5180
export const PREVIEW_PORT = 4180

export default defineConfig({
  server: {
    port: DEV_PORT,
    strictPort: true,
  },
  preview: {
    port: PREVIEW_PORT,
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'EL PARCHE — Hamburguesas Urbanas',
        short_name: 'EL PARCHE',
        description:
          'Hamburguesas urbanas 100% a domicilio. Calle, sabor y parche.',
        theme_color: '#0B0B0D',
        background_color: '#0B0B0D',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'es-CO',
        categories: ['food', 'shopping'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,woff2}'],
        navigateFallback: '/index.html',
        // Agrega los listeners de notificaciones (click y push) al SW generado.
        importScripts: ['sw-push.js'],
        runtimeCaching: [
          {
            // Fotos propias: se cachean al primer uso y quedan disponibles offline.
            urlPattern: /\/img\/.*\.(?:jpg|jpeg|png|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'elparche-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
