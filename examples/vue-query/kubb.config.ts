import { adapterOas } from '@kubb/adapter-oas'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { defineConfig } from 'kubb/config'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      postGenerate: ['npm run typecheck'],
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
      // The slim client. pluginVueQuery auto-detects it (no `client` option needed) and the composables
      // call its generated functions, surfacing `ResponseError` from the bundled `.kubb/client.ts`.
      pluginFetch({
        output: { path: './clients', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
      pluginVueQuery({
        output: { path: './hooks', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
    ],
  }
})
