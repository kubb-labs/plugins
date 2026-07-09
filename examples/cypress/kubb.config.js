import { adapterOas } from '@kubb/adapter-oas'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

const input = './petStore.yaml'
export default defineConfig([
  {
    root: '.',
    input,
    adapter: adapterOas({ unknownType: 'unknown' }),
    output: {
      path: './src/gen',
      clean: true,
      lint: false,
      format: false,
      barrel: { type: 'named' },
    },
    plugins: [
      pluginTs({
        output: {
          path: 'models.ts',
          mode: 'file',
        },
      }),
      pluginCypress({
        output: {
          path: 'cypress',
        },
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Requests`
          },
        },
        baseURL: 'http://localhost:3000',
      }),
    ],
  },
  {
    root: '.',
    input,
    adapter: adapterOas({ unknownType: 'unknown' }),
    output: { path: './src/gen-v4', clean: true },
    plugins: [
      pluginTs({
        output: { path: 'models.ts', mode: 'file' },
      }),
      pluginCypress({
        output: { path: 'cypress' },
        baseURL: 'http://localhost:3000',
      }),
    ],
  },
])
