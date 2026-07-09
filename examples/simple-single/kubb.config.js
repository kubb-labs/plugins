import { adapterOas } from '@kubb/adapter-oas'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb/config'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: './petStore.yaml',
    output: {
      path: './src/gen',
      clean: true,
      barrel: { type: 'named' },
      lint: false,
      format: 'auto',
    },
    hooks: {
      done: ['npm run typecheck'],
    },
    adapter: adapterOas({ unknownType: 'unknown', collisionDetection: false, enums: 'root' }),
    parsers: [parserTs({ extension: { '.ts': '' } }), parserTsx()],
    plugins: [
      pluginRedoc({
        output: {
          path: './docs/index.html',
        },
      }),
      pluginTs({
        output: { path: 'models.ts', mode: 'file', clean: true },
      }),
      pluginFetch({
        output: { path: './clients', barrel: { type: 'named' } },
      }),
      pluginReactQuery({
        output: {
          path: './hooks.ts',
          mode: 'file',
        },
      }),
      pluginZod({
        output: {
          path: './zod.ts',
          mode: 'file',
        },
      }),
    ],
  },
])
