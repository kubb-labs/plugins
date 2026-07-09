import { adapterOas } from '@kubb/adapter-oas'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  root: '.',
  input: './petStore.yaml',
  output: {
    path: './src/gen',
    postGenerate: ['npm run typecheck'],
    clean: true,
    format: false,
    lint: false,
  },
  adapter: adapterOas({ unknownType: 'unknown', enums: 'root' }),
  plugins: [
    pluginTs({
      output: { path: 'models' },
      group: { type: 'tag' },
    }),
    pluginFetch({
      output: {
        path: './sdk',
        barrel: { type: 'all', nested: true },
      },
      group: { type: 'tag' },
      sdk: { name: 'petStoreSDK' },
    }),
  ],
})
