import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// @kubb/renderer-jsx is an external package (not a workspace package) that is not
// hoisted to the root node_modules by pnpm's strict isolation. We alias it
// directly to the pnpm virtual store so vitest can resolve it when processing
// workspace package source files that transitively import it.
const rendererJsx = path.resolve(__dirname, '../node_modules/.pnpm/@kubb+renderer-jsx@5.0.0-beta.18/node_modules/@kubb/renderer-jsx')

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@internals/utils': path.resolve(__dirname, '../internals/utils/src/index.ts'),
      '@kubb/renderer-jsx/jsx-dev-runtime': path.join(rendererJsx, 'dist/jsx-dev-runtime.js'),
      '@kubb/renderer-jsx/jsx-runtime': path.join(rendererJsx, 'dist/jsx-runtime.js'),
      '@kubb/renderer-jsx/types': path.join(rendererJsx, 'dist/types.js'),
      '@kubb/renderer-jsx': path.join(rendererJsx, 'dist/index.js'),
    },
  },
  test: {
    include: ['**/*.bench.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    server: {
      deps: {
        // axios is an optional peer dep of @kubb/plugin-client; exclude it
        // from bundling so Vite does not error when resolving the optional stub
        external: ['axios'],
      },
    },
    benchmark: {
      include: ['**/*.bench.ts'],
    },
  },
})
