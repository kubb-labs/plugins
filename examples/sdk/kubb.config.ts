import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

export default defineConfig({
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
  },
  adapter: adapterOas(),
  plugins: [
    pluginTs({
      output: { path: 'models' },
      group: { type: 'tag' },
    }),
    pluginClient({
      output: {
        path: './sdk',
        barrelType: 'propagate',
      },
      client: 'fetch',
      group: { type: 'tag' },
      pathParamsType: 'object',
      sdk: { className: 'PetStoreSDK' },
    }),
  ],
})
