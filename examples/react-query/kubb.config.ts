import { adapterOas } from '@kubb/adapter-oas'
import { URLPath } from '@kubb/core'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

function hookName(name: string): string {
  return `${name}Hook`
}

/** @type {import('@kubb/core').UserConfig} */
export const config = {
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  adapter: adapterOas({ integerType: 'number' }),
  output: {
    path: './src/gen',
    clean: true,
    barrel: { type: 'named' },
    defaultBanner: 'simple' as const,
    format: false,
    lint: false,
  },
  hooks: {
    done: ['npm run typecheck', 'oxfmt ./', 'oxlint --fix ./src'],
  },
  plugins: [
    pluginTs({
      output: {
        path: 'models',
        barrel: { type: 'named' },
        banner(meta) {
          return `// version: ${meta?.version || 'unknown'}`
        },
      },
    }),
    pluginReactQuery({
      client: {
        bundle: true,
      },
      resolver: {
        resolveQueryName(node) {
          return hookName(`use${capitalize(this.resolveName(node.operationId))}`)
        },
        resolveSuspenseQueryName(node) {
          return hookName(`use${capitalize(this.resolveName(node.operationId))}Suspense`)
        },
        resolveInfiniteQueryName(node) {
          return hookName(`use${capitalize(this.resolveName(node.operationId))}Infinite`)
        },
        resolveSuspenseInfiniteQueryName(node) {
          return hookName(`use${capitalize(this.resolveName(node.operationId))}SuspenseInfinite`)
        },
        resolveMutationName(node) {
          return hookName(`use${capitalize(this.resolveName(node.operationId))}`)
        },
        resolveQueryOptionsName(node) {
          return hookName(`${this.resolveName(node.operationId)}QueryOptions`)
        },
        resolveSuspenseQueryOptionsName(node) {
          return hookName(`${this.resolveName(node.operationId)}SuspenseQueryOptions`)
        },
        resolveInfiniteQueryOptionsName(node) {
          return hookName(`${this.resolveName(node.operationId)}InfiniteQueryOptions`)
        },
        resolveSuspenseInfiniteQueryOptionsName(node) {
          return hookName(`${this.resolveName(node.operationId)}SuspenseInfiniteQueryOptions`)
        },
        resolveMutationOptionsName(node) {
          return hookName(`${this.resolveName(node.operationId)}MutationOptions`)
        },
        resolveClientName(node) {
          return hookName(this.resolveName(node.operationId))
        },
        resolveSuspenseClientName(node) {
          return hookName(`${this.resolveName(node.operationId)}Suspense`)
        },
        resolveInfiniteClientName(node) {
          return hookName(`${this.resolveName(node.operationId)}Infinite`)
        },
        resolveSuspenseInfiniteClientName(node) {
          return hookName(`${this.resolveName(node.operationId)}SuspenseInfinite`)
        },
      },
      output: {
        path: './hooks',
        barrel: { type: 'named' },
      },
      group: {
        type: 'path',
      },
      queryKey({ node, casing }) {
        const path = new URLPath(node.path, { casing })
        const hasQueryParams = node.parameters?.some((p) => p.in === 'query') ?? false
        const hasRequestBody = !!node.requestBody?.content?.[0]?.schema

        return [
          '"v5"',
          path.toObject({ type: 'path', stringify: true }),
          hasQueryParams ? '...(params ? [params] : [])' : undefined,
          hasRequestBody ? '...(data ? [data] : [])' : undefined,
        ].filter(Boolean) as [string, ...string[]]
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
