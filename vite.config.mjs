import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import fs from 'node:fs';
import path from 'node:path';
import { criticalCssPlugin } from './scripts/critical-css.mjs';

/**
 * Stamp a per-build identifier into the service worker.
 *
 * The service worker lives in `public/`, so Vite copies it verbatim and the
 * `define` replacement below never reaches it. Without a build id the worker
 * kept a single, permanently named cache, so a redeploy that replaced the
 * teacher voice pack kept serving the previous recording to every device
 * that had already visited the site.
 */
function serviceWorkerBuildId(buildId) {
  let outDir = 'dist';
  return {
    name: 'service-worker-build-id',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const source = fs.readFileSync(swPath, 'utf8');
      fs.writeFileSync(swPath, source.replace(/__BUILD_ID__/g, buildId));
    },
  };
}

const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  root: '.',
  publicDir: 'public',
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
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
    }),
    serviceWorkerBuildId(BUILD_ID),
    // The critical CSS is EXTRACTED from css/styles.css at build time and
    // injected into index.html. It used to be copied by hand, which is how
    // the inline copy drifted from the stylesheet.
    criticalCssPlugin({ root: '.' }),
  ],
  server: {
    port: 8080,
    open: true
  },
  css: {
    devSourcemap: true
  }
});