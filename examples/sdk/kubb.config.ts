import { adapterOas } from '@kubb/adapter-oas'
import { pluginFetch } from '@kubb/plugin-fetch'
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
    format: false,
    lint: false,
  },
  adapter: adapterOas({ enums: 'root' }),
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
