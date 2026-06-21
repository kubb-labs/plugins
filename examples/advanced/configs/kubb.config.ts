import { adapterOas } from '@kubb/adapter-oas'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

import { defineConfig } from 'kubb'

export default defineConfig({
  name: 'gen',
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  adapter: adapterOas({
    validate: true,
    discriminator: 'preserve',
    integerType: 'number',
    enums: 'root',
  }),
  output: {
    path: './src/gen',
    clean: true,
    barrel: { type: 'named' },
    defaultBanner: false,
    lint: false,
    format: 'oxfmt',
  },
  hooks: {
    done: ['npm run typecheck'],
  },
  plugins: [
    pluginRedoc(),
    pluginTs({
      output: {
        path: 'models/ts',
      },
      group: {
        type: 'tag',
      },
      arrayType: 'generic',
      enum: { type: 'asConst' },
      override: [
        {
          type: 'operationId',
          pattern: 'findPetsByStatus',
          options: {
            enum: { type: 'enum', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
          },
        },
      ],
    }),
    pluginZod({
      output: {
        path: './zod',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag' },
      dateType: 'stringOffset',
      inferred: true,
      typed: true,
      operations: false,
    }),
    pluginReactQuery({
      output: {
        path: './clients/hooks',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      override: [
        {
          type: 'operationId',
          pattern: 'findPetsByTags',
          options: {
            infinite: {
              queryParam: 'pageSize',
              initialPageParam: 0,
            },
            mutation: {
              importPath: '@tanstack/react-query',
              methods: ['post', 'put', 'delete'],
            },
          },
        },
      ],
      group: { type: 'tag' },
      query: {
        importPath: '../../../../tanstack-query-hook',
      },
      infinite: false,
      suspense: false,
      parser: 'zod',
    }),
    pluginAxios({
      output: {
        path: './clients/axios',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      parser: 'zod',
      group: { type: 'tag', name: ({ group }) => `${group}Service` },
      baseURL: 'https://petstore3.swagger.io/api/v3',
      override: [
        {
          type: 'contentType',
          pattern: 'multipart/form-data',
          options: {
            parser: false,
          },
        },
        {
          type: 'contentType',
          pattern: 'application/octet-stream',
          options: {
            parser: false,
          },
        },
      ],
    }),
    pluginMcp({
      output: {
        path: './mcp',
        barrel: false,
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag' },
      client: {
        baseURL: 'https://petstore.swagger.io/v2',
      },
    }),
    pluginFaker({
      output: {
        path: 'mocks',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag' },
      mapper: {
        status: `faker.helpers.arrayElement<any>(['working', 'idle'])`,
      },
      resolver: {
        resolveName(name, type) {
          return `${this.default(name, type)}Faker`
        },
      },
    }),
    pluginCypress({
      output: {
        path: 'cypress',
        barrel: false,
      },
      group: { type: 'tag' },
    }),
    pluginMsw({
      output: {
        path: 'msw',
      },
      handlers: true,
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag' },
    }),
  ],
})
