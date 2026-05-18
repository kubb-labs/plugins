import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@internals/utils': path.resolve(__dirname, '../internals/utils/src/index.ts'),
    },
  },
  oxc: {
    transform: {
      jsx: {
        runtime: 'automatic',
        importSource: 'react',
      },
    },
  },
  test: {
    include: ['**/*.bench.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
    },
  },
})
