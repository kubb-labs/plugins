import { adapterOas } from '@kubb/adapter-oas'
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
    pluginSwr({
      output: {
        path: './hooks',
        barrel: { type: 'named' },
      },
      group: {
        type: 'tag',
      },
      client: {
        importPath: '@kubb/plugin-client/clients/axios',
        dataReturnType: 'data',
      },
      pathParamsType: 'object',
    }),
  ],
})
