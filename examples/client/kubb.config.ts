import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
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
        // deletePet's path/header params cover issue #875 (interface params reaching the
        // client's RequestConfig). Everything else keeps the default `type` alias.
        override: [{ type: 'operationId', pattern: 'deletePet', options: { syntaxType: 'interface' } }],
      }),
      pluginClient({
        output: { path: './clients', mode: 'directory', barrel: { type: 'named' } },
        group: { type: 'tag' },
        // resolved from each generated operation file (src/gen/clients/<tag>/), so it points at src/client.ts
        importPath: '../../../client',
      }),
    ],
  }
})
