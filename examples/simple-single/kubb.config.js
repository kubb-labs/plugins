import { adapterOas } from '@kubb/adapter-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
      barrel: { type: 'named' },
      extension: {
        '.ts': '',
      },
      lint: false,
      format: 'auto',
    },
    hooks: {
      done: ['npm run typecheck'],
    },
    adapter: adapterOas({ collisionDetection: false }),
    plugins: [
      pluginRedoc({
        output: {
          path: './docs/index.html',
        },
      }),
      pluginTs({
        output: { path: 'models.ts', mode: 'file', clean: true },
      }),
      pluginReactQuery({
        output: {
          path: './hooks.ts',
          mode: 'file',
        },
        client: {
          importPath: '@kubb/plugin-client/clients/axios',
        },
      }),
      pluginZod({
        output: {
          path: './zod.ts',
          mode: 'file',
        },
        operations: false,
      }),
    ],
  },
])
