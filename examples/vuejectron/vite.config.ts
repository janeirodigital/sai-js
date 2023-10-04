// Plugins
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

// Utilities
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss'
      }
    })
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue']
  },
  optimizeDeps: {
    exclude: [
      '@janeirodigital/interop-application',
      '@janeirodigital/interop-utils',
      '@janeirodigital/interop-data-model'
    ],
    include: ['jsonld-streaming-parser', 'n3', 'http-link-header']
  },
  server: {
    hmr: {
      overlay: false
    },
    port: 4500,
    fs: {
      strict: false
    }
  }
});
