import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    adapter: adapterOas({ validate: false, integerType: 'number', enums: 'root' }),
    hooks: {
      done: ['npm run typecheck', 'oxfmt ./', 'oxlint --fix ./src'],
    },
    output: {
      path: './src/gen',
      clean: true,
      barrel: { type: 'all' },
      extension: {
        '.ts': '.js',
      },
      format: false,
      lint: false,
    },
    plugins: [
      pluginTs({
        output: { path: 'models/ts', barrel: { type: 'named' } },
      }),
      pluginZod({}),
      // A registered contract client. pluginMcp detects it and its handlers call the injected
      // `.kubb/client.ts` contract runtime, which returns the shared `RequestResult` shape.
      pluginClient({
        output: { path: './clients', barrel: { type: 'named' } },
      }),
      pluginMcp({
        client: {
          baseURL: 'https://petstore.swagger.io/v2',
        },
      }),
    ],
  }
})
