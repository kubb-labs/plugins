import { adapterOas } from '@kubb/adapter-oas'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb/config'

export default defineConfig(() => {
  return {
    root: '.',
    input: './petStore.yaml',
    adapter: adapterOas({ unknownType: 'unknown', validate: false, integerType: 'number', enums: 'root' }),
    output: {
      path: './src/gen',
      postGenerate: ['npm run typecheck', 'oxfmt ./', 'oxlint --fix ./src'],
      clean: true,
      barrel: { type: 'all' },
      format: false,
      lint: false,
    },
    parsers: [parserTs(), parserTsx()],
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
