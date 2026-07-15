import { adapterOas } from '@kubb/adapter-oas'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb/config'

export default defineConfig(() => {
  return {
    root: '.',
    input: 'https://petstore3.swagger.io/api/v3/openapi.json',
    adapter: adapterOas({ validate: false }),
    output: {
      path: './src/gen',
      clean: true,
      format: 'oxfmt',
    },
    // TODO: drop once @kubb/parser-ts releases the beta.92 default (no extension on relative
    // imports) and the catalog is bumped to it.
    parsers: [parserTs({ extension: { '.ts': '' } }), parserTsx({ extension: { '.ts': '' } })],
    plugins: [
      pluginTs({
        output: {
          path: 'models/ts',
          mode: 'directory',
          barrel: false,
        },
        group: {
          type: 'tag',
        },
        enum: { type: 'asConst' },
      }),
      pluginReactQuery({
        output: {
          path: './clients/hooks',
          mode: 'directory',
        },
        group: { type: 'tag' },
        mutation: {
          methods: ['post', 'put', 'delete'],
        },
      }),
      pluginAxios({
        output: {
          path: './clients/axiosClass',
          mode: 'directory',
          barrel: false,
        },
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Service`
          },
        },
      }),
      pluginCypress({
        output: {
          path: './clients/cypress',
          mode: 'directory',
          barrel: false,
        },
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Requests`
          },
        },
      }),
      pluginZod({
        output: {
          path: './zod',
          mode: 'directory',
          barrel: false,
        },
        group: { type: 'tag' },
        inferred: true,
        typed: false,
        operations: false,
      }),
      pluginFaker({
        output: {
          path: 'mocks',
          mode: 'directory',
          barrel: false,
        },
        group: { type: 'tag' },
      }),
      pluginMsw({
        output: {
          path: 'msw',
          mode: 'directory',
        },
        group: { type: 'tag' },
      }),
    ],
    hooks: {
      done: ['npm run typecheck'],
    },
  }
})
