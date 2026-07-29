import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function normalizeBase(value: string | undefined): string {
  if (!value) {
    return '/';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const actionBase =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName
    ? `/${repositoryName}/`
    : undefined;
const base = normalizeBase(process.env.VITE_BASE_PATH ?? actionBase);

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'ClawdCam',
        short_name: 'ClawdCam',
        description:
          'A local-first camera PWA for composing, saving, downloading, and sharing Clawd photos.',
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: '#fff8ed',
        background_color: '#fff8ed',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
