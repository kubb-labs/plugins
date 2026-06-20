import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'

import { defineConfig } from 'kubb'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck', 'oxfmt ./', 'oxlint --fix ./src'],
    },
    output: {
      path: './src/gen',
      clean: true,
      barrel: { type: 'named' },
      format: false,
      lint: false,
    },
    adapter: adapterOas({ server: { index: 0 }, enums: 'root' }),
    plugins: [
      pluginTs({
        output: { path: 'models.ts', mode: 'file' },
      }),
      pluginClient({
        output: {
          path: '.',
        },
        client: 'fetch',
      }),
    ],
  }
})
