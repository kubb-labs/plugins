import { adapterOas } from '@kubb/adapter-oas'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig(() => {
  return {
    root: '.',
    input: './petStore.yaml',
    output: {
      path: './src/gen',
      postGenerate: ['npm run typecheck'],
      clean: true,
      barrel: { type: 'named' },
      format: false,
      lint: false,
    },
    adapter: adapterOas({ unknownType: 'unknown', server: { index: 0 } }),
    plugins: [
      pluginTs({
        output: { path: 'models', mode: 'directory', barrel: { type: 'named' } },
        group: { type: 'tag' },
        // `src/index.ts` passes `GetPetByIdResponses` to `isResponseError`, which needs the named operation types.
        operations: 'export',
        // deletePet's path/header params cover issue #875 (interface params reaching the
        // client's RequestConfig). Everything else keeps the default `type` alias.
        override: [{ type: 'operationId', pattern: 'deletePet', options: { syntaxType: 'interface' } }],
      }),
      pluginFetch({
        output: { path: './clients', mode: 'directory', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
    ],
  }
})
