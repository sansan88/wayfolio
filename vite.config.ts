import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Unterpfad für das Hosting, z.B. BASE_PATH=/wayfolio/ für GitHub Pages. Lokal: "/".
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  worker: { format: 'es' },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Wayfolio',
        short_name: 'Wayfolio',
        description: 'Reisetagebuch mit Karte, Stories und Abstimmungen – Familie und Freunde folgen per Link.',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1f6feb',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Supabase-Anfragen nie aus dem Cache beantworten
        navigateFallbackDenylist: [/^\/auth\//],
      },
    }),
  ],
})
