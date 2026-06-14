import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks(id) {
          if (id.includes('event-bus.js') || id.includes('event-manager.js')) {
            return 'vendor-core';
          }
          if (id.includes('audio-manager.js')) {
            return 'vendor-audio';
          }
          if (id.includes('collision-manager.js') || id.includes('particles.js')) {
            return 'vendor-game';
          }
          if (id.includes('ui-utils.js') || id.includes('display-manager.js') || id.includes('android-benq-init.js')) {
            return 'vendor-ui';
          }
          if (id.includes('performance-utils.js')) {
            return 'vendor-perf';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|ttf|eot)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          if (/\.(wav|mp3|ogg)$/.test(assetInfo.name)) {
            return `assets/sounds/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true
    }
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  server: {
    port: 8080,
    open: true
  },
  css: {
    devSourcemap: true
  }
});