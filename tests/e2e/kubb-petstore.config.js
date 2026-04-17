import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    adapter: adapterOas({ validate: false }),
    output: {
      path: './src/gen',
      clean: true,
      format: 'biome',
      lint: 'biome',
    },
    plugins: [
      pluginTs({
        output: {
          path: 'models/ts',
          barrelType: false,
        },
        group: {
          type: 'tag',
        },
        enumType: 'asConst',
        compatibilityPreset: 'kubbV4',
      }),
      pluginReactQuery({
        output: {
          path: './clients/hooks',
        },
        group: { type: 'tag' },
        mutation: {
          methods: ['post', 'put', 'delete'],
        },
      }),
      pluginClient({
        output: {
          path: './clients/axiosClass',
          barrelType: false,
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
          barrelType: false,
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
          barrelType: false,
        },
        group: { type: 'tag' },
        inferred: true,
        typed: false,
        operations: false,
        compatibilityPreset: 'kubbV4',
      }),
      pluginFaker({
        output: {
          path: 'mocks',
          barrelType: false,
        },
        group: { type: 'tag' },
      }),
      pluginMsw({
        output: {
          path: 'msw',
        },
        group: { type: 'tag' },
      }),
    ],
    hooks: {
      done: ['npm run typecheck'],
    },
  }
})
