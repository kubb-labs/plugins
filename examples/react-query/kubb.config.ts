import { adapterOas } from '@kubb/adapter-oas'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck'],
    },
    output: {
      path: './src/gen',
      clean: true,
      barrel: { type: 'named' },
      format: false,
      lint: false,
    },
    adapter: adapterOas({ unknownType: 'unknown', serverIndex: 0 }),
    plugins: [
      pluginTs({
        output: { path: 'models', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
      // The slim client. pluginReactQuery auto-detects it (no `client` option needed) and the hooks
      // call its generated functions, surfacing `ResponseError` from the bundled `.kubb/client.ts`.
      pluginFetch({
        output: { path: './clients', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
      pluginReactQuery({
        output: { path: './hooks', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
    ],
  }
})
