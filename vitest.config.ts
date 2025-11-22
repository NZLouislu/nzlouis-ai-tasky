import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: true,
    exclude: [
      'node_modules',
      'e2e/**',
      'tests/e2e/**',
      'src/__tests__/stories/**',
      'src/__tests__/unit/ai-models.test.ts',
      'src/__tests__/unit/ai-providers.test.ts',
      'src/lib/stories/**/__tests__/**',
      'src/app/api/stories/trello/sync/__tests__/**'
    ],
    server: {
      deps: {
        inline: ['next-auth'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'src/**/__tests__/**',
        '**/test-utils.ts',
        'e2e/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    conditions: ['node', 'default'],
  },
  ssr: {
    noExternal: ['next-auth'],
  },
});