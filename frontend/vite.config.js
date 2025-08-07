import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-node-polyfills";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function r(modulePath) {
  return resolve(__dirname, "node_modules", modulePath);
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      process: r("process/browser.js"),
      stream: r("stream-browserify/index.js"),
      util: r("util/util.js"),
      events: r("events/events.js"),
      buffer: r("buffer/index.js"),
      assert: r("assert/build/assert.js"),
      crypto: r("crypto-browserify/index.js"),
      http: r("stream-http/index.js"),
      https: r("https-browserify/index.js"),
      os: r("os-browserify/browser.js"),
      url: r("url/url.js"),
    },
  },
  define: {
    global: "window",
    "process.env": {},
  },
  build: {
    target: ["es2015", "safari12"],
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    rollupOptions: {
      plugins: [nodePolyfills()],
      output: {
        format: "es",
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash].[ext]",
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "socket.io-client",
      "simple-peer",
      "buffer",
      "process",
      "util",
      "events",
      "stream-browserify",
      "crypto-browserify",
      "stream-http",
      "https-browserify",
      "os-browserify",
      "url",
      "assert",
    ],
    exclude: ["@tanstack/react-query"],
  },
  esbuild: {
    target: "es2015",
    supported: {
      bigint: false,
    },
  },
});
