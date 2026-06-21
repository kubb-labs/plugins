import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  adapter: adapterOas({ enums: 'root' }),
  output: {
    path: './src/gen',
    clean: true,
    barrel: { type: 'named' },
    format: false,
    lint: false,
  },
  hooks: {
    done: ['npm run typecheck'],
  },
  plugins: [
    pluginTs({
      output: {
        path: 'models',
        barrel: { type: 'named' },
      },
    }),
    // A registered contract client. pluginSwr auto-detects it (no `client` option needed) and the
    // hooks call its generated `<op>` functions, which return the shared `RequestResult` contract.
    pluginClient({
      output: { path: './clients', barrel: { type: 'named' } },
      group: { type: 'tag' },
    }),
    pluginSwr({
      output: {
        path: './hooks',
        barrel: { type: 'named' },
      },
      group: {
        type: 'tag',
      },
    }),
  ],
})
