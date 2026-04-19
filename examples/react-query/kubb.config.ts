import { pluginReactQuery } from '@kubb/plugin-react-query'
import { QueryKey } from '@kubb/plugin-react-query/components'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

/** @type {import('@kubb/core').UserConfig} */
export const config = {
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    defaultBanner: 'simple' as const,
  },
  hooks: {
    done: ['npm run typecheck', 'oxfmt ./', 'oxlint --fix ./src'],
  },
  plugins: [
    pluginTs({
      output: {
        path: 'models',
        banner(oas) {
          return `// version: ${oas?.meta?.version || 'unknown'}`
        },
      },
    }),
    pluginReactQuery({
      client: {
        bundle: true,
      },
      transformers: {
        name: (name, type) => {
          if (type === 'file' || type === 'function') {
            return `${name}Hook`
          }
          return name
        },
      },
      output: {
        path: './hooks',
      },
      group: {
        type: 'path',
      },
      queryKey(props) {
        const keys = QueryKey.getTransformer(props)
        return ['"v5"', ...keys]
      },
      customOptions: {
        importPath: '../../../useCustomHookOptions.ts',
        name: 'useCustomHookOptions',
      },
      paramsType: 'inline',
      pathParamsType: 'object',
      suspense: {},
      override: [
        {
          type: 'operationId',
          pattern: 'findPetsByTags',
          options: {
            client: {
              dataReturnType: 'full',
            },
            infinite: {
              queryParam: 'pageSize',
              initialPageParam: 0,
              cursorParam: undefined,
            },
          },
        },
        {
          type: 'operationId',
          pattern: 'getInventory',
          options: {
            query: false,
          },
        },
        {
          type: 'operationId',
          pattern: 'updatePetWithForm',
          options: {
            query: {
              importPath: '@tanstack/react-query',
              methods: ['post'],
            },
            mutation: {
              importPath: '@tanstack/react-query',
              methods: ['put', 'delete'],
            },
            pathParamsType: 'inline',
          },
        },
      ],
    }),
  ],
}

export default defineConfig(config)
