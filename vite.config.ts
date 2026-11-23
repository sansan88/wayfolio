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
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Wayfolio – Reisetagebuch',
        short_name: 'Wayfolio',
        description: 'Reisetagebuch mit Check-ins, Fotos und Karte – Familie und Freunde folgen per Link.',
        lang: 'de-CH',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2f2f7',
        theme_color: '#1f6feb',
        categories: ['travel', 'lifestyle'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-Hülle (JS, CSS, HTML, Icons) vorab offline verfügbar
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/auth\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Fotos und Routenbilder (signierte URLs): Schlüssel ohne Token, damit sie offline wiedergefunden werden
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/object/sign/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'wayfolio-media',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }) => {
                    const u = new URL(request.url)
                    return `${u.origin}${u.pathname}`
                  },
                },
              ],
            },
          },
          {
            // Kartenkacheln, Schriften und Stil von OpenFreeMap
            urlPattern: ({ url }) => url.hostname === 'tiles.openfreemap.org',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wayfolio-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
