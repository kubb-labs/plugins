import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

const pkgDist = (name: string, file = 'index.js') =>
  path.join(root, 'packages', name, 'dist', file)

// @kubb/renderer-jsx is a non-workspace external package not hoisted by pnpm.
const rendererJsx = path.join(
  root,
  'node_modules/.pnpm/@kubb+renderer-jsx@5.0.0-beta.18/node_modules/@kubb/renderer-jsx',
)

// Workspace packages (plugin-ts, plugin-zod, plugin-client, plugin-react-query)
// are NOT in the root node_modules because only plugin-ts and plugin-zod are
// devDependencies of the root. When Vite resolves imports from *within* those
// packages' dist/, it looks up from packages/<name>/dist/ and cannot reach
// tests/benchmark/node_modules/. We alias every kubb workspace package to its
// compiled dist so Vite always finds them regardless of the caller's location.
export default defineConfig({
  resolve: {
    alias: [
      // renderer-jsx sub-paths must come before the main entry
      { find: '@kubb/renderer-jsx/jsx-dev-runtime', replacement: path.join(rendererJsx, 'dist/jsx-dev-runtime.js') },
      { find: '@kubb/renderer-jsx/jsx-runtime', replacement: path.join(rendererJsx, 'dist/jsx-runtime.js') },
      { find: '@kubb/renderer-jsx/types', replacement: path.join(rendererJsx, 'dist/types.js') },
      { find: '@kubb/renderer-jsx', replacement: path.join(rendererJsx, 'dist/index.js') },
      // plugin-client sub-path exports
      { find: '@kubb/plugin-client/templates/clients/axios.source', replacement: pkgDist('plugin-client', 'templates/clients/axios.source.js') },
      { find: '@kubb/plugin-client/templates/clients/fetch.source', replacement: pkgDist('plugin-client', 'templates/clients/fetch.source.js') },
      { find: '@kubb/plugin-client/templates/config.source', replacement: pkgDist('plugin-client', 'templates/config.source.js') },
      { find: '@kubb/plugin-client', replacement: pkgDist('plugin-client') },
      // main workspace plugins
      { find: '@kubb/plugin-ts', replacement: pkgDist('plugin-ts') },
      { find: '@kubb/plugin-zod', replacement: pkgDist('plugin-zod') },
      { find: '@kubb/plugin-react-query', replacement: pkgDist('plugin-react-query') },
      // remeda is a direct dep of plugin-react-query but is not hoisted
      {
        find: 'remeda',
        replacement: path.join(root, 'node_modules/.pnpm/remeda@2.34.1/node_modules/remeda/dist/index.js'),
      },
    ],
  },
  test: {
    include: ['**/*.bench.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 600_000,
    benchmark: {
      include: ['**/*.bench.ts'],
      reporters: ['default'],
    },
  },
})
