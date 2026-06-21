import { adapterOas } from '@kubb/adapter-oas'
import { pluginAxios } from '@kubb/plugin-axios'
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
      // A registered contract client. pluginMcp detects it and its handlers import and call its
      // generated `<op>` functions, which return the shared `RequestResult` shape.
      pluginAxios({
        output: { path: './clients', barrel: { type: 'named' } },
        baseURL: 'https://petstore.swagger.io/v2',
      }),
      pluginMcp({}),
    ],
  }
})
