import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

const input = { path: './petStore.yaml' } as const

const tsPlugin = pluginTs({
  output: { path: 'models/ts' },
  group: { type: 'tag' },
  enum: { type: 'asConst' },
})

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
      extension: {
        '.ts': '.js',
      },
      format: false,
      lint: false,
    },
    adapter: adapterOas({ dateType: 'date', enums: 'root' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/axios',
          barrel: { type: 'all', nested: true },
          banner: '/* eslint-disable no-alert, no-console */',
        },
        client: 'fetch',
        importPath: '@kubb/plugin-client/clients/fetch',
        exclude: [{ type: 'tag', pattern: 'store' }],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Service`
          },
        },
        operations: true,
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2', format: false, lint: false },
    adapter: adapterOas({ dateType: 'date', contentType: 'application/xml', enums: 'root' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/axios/xml',
          barrel: { type: 'all', nested: true },
          banner: '/* eslint-disable no-alert, no-console */',
        },
        importPath: '@kubb/plugin-client/clients/axios',
        include: [{ type: 'operationId', pattern: 'uploadFile' }],
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen6', clean: true, format: false, lint: false },
    adapter: adapterOas({ dateType: 'date', enums: 'root' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: { path: './tag.ts', mode: 'file' },
        importPath: '@kubb/plugin-client/clients/axios',
        parser: false,
        include: [{ type: 'tag', pattern: 'store' }],
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen7', clean: true, format: false, lint: false },
    hooks: {
      done: ['npm run typecheck', 'oxfmt ./', 'oxlint --fix ./src'],
    },
    adapter: adapterOas({ dateType: 'date', enums: 'root' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/class',
          barrel: false,
          banner: '/* eslint-disable no-alert, no-console */',
        },
        client: 'fetch',
        importPath: '@kubb/plugin-client/clients/fetch',
        clientType: 'class',
        group: { type: 'tag' },
      }),
    ],
  },
])
