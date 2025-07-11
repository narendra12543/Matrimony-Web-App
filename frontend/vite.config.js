import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-node-polyfills';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function r(modulePath) {
  return resolve(__dirname, 'node_modules', modulePath);
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      process: r('process/browser.js'),
      stream: r('stream-browserify/index.js'),
      util: r('util/util.js'),
      events: r('events/events.js'),
      buffer: r('buffer/index.js'),
      assert: r('assert/build/assert.js'),
      crypto: r('crypto-browserify/index.js'),
      http: r('stream-http/index.js'),
      https: r('https-browserify/index.js'),
      os: r('os-browserify/browser.js'),
      url: r('url/url.js'),
    },
  },
  define: {
    global: 'window',
    'process.env': {},
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
