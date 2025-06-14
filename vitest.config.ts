import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'convex/_generated/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockServiceWorker.js',
        'tests/**'
      ],
      thresholds: {
        global: {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0
        }
        // Critical payment files will have 95% thresholds once we implement their tests
        // './convex/subscriptions.ts': {
        //   branches: 95,
        //   functions: 95,
        //   lines: 95,
        //   statements: 95
        // },
        // './convex/stripe.ts': {
        //   branches: 95,
        //   functions: 95,
        //   lines: 95,
        //   statements: 95
        // }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, './app'),
    }
  }
})