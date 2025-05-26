import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    env: { ...config({ path: './.env' }).parsed },
    alias: {
      '@digita-ai/handlersjs-core': new URL(
        './node_modules/@digita-ai/handlersjs-core/dist/index.js',
        import.meta.url
      ).pathname,
      '@digita-ai/handlersjs-http': new URL(
        './node_modules/@digita-ai/handlersjs-http/dist/index.js',
        import.meta.url
      ).pathname,
      '@digita-ai/handlersjs-logger': new URL(
        './node_modules/@digita-ai/handlersjs-logger/dist/index.js',
        import.meta.url
      ).pathname,
    },
  },
})
