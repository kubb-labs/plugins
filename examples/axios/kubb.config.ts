import { adapterOas } from '@kubb/adapter-oas'
import { pluginAxios } from '@kubb/plugin-axios'
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
    adapter: adapterOas({
      unknownType: 'unknown',
      server: {
        index: 0,
      },
    }),
    plugins: [
      pluginTs({
        output: { path: 'models', mode: 'directory', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
      pluginAxios({
        output: { path: './clients', mode: 'directory', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
    ],
  }
})
