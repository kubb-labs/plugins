import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'
import { clientOperationGenerator } from './src/generators/clientOperationGenerator'
import { clientOperationReactGenerator } from './src/generators/clientOperationReactGenerator'
import { clientStaticGenerator } from './src/generators/clientStaticGenerator'

const input = { path: './petStore.yaml' } as const

const tsPlugin = pluginTs({
  output: { path: 'models/ts' },
  group: { type: 'tag' },
  enumType: 'asConst',
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
    },
    adapter: adapterOas({ dateType: 'date' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/axios',
          barrelType: 'propagate',
          banner: '/* eslint-disable no-alert, no-console */',
        },
        client: 'fetch',
        exclude: [{ type: 'tag', pattern: 'store' }],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Service`
          },
        },
        operations: true,
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2' },
    adapter: adapterOas({ dateType: 'date', contentType: 'application/xml' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/axios/xml',
          barrelType: 'propagate',
          banner: '/* eslint-disable no-alert, no-console */',
        },
        include: [{ type: 'operationId', pattern: 'uploadFile' }],
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen3', clean: true },
    adapter: adapterOas({ dateType: 'date' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: { path: './tagObject.ts' },
        generators: [clientStaticGenerator],
        include: [{ type: 'tag', pattern: 'store' }],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Controller`
          },
        },
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen4', clean: true },
    adapter: adapterOas({ dateType: 'date' }),
    plugins: [
      pluginClient({
        output: { path: './tagClientOperation.ts' },
        generators: [clientOperationGenerator],
        include: [{ type: 'tag', pattern: 'store' }],
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen5', clean: true },
    adapter: adapterOas({ dateType: 'date' }),
    plugins: [
      pluginClient({
        output: { path: './tagClientOperationReact.ts' },
        generators: [clientOperationReactGenerator],
        include: [{ type: 'tag', pattern: 'store' }],
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen6', clean: true },
    adapter: adapterOas({ dateType: 'date' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: { path: './tag.ts' },
        parser: 'client',
        include: [{ type: 'tag', pattern: 'store' }],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Controller`
          },
        },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen7', clean: true },
    hooks: {
      done: ['npm run typecheck', 'oxfmt ./', 'oxlint --fix ./src'],
    },
    adapter: adapterOas({ dateType: 'date' }),
    plugins: [
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/class',
          barrelType: false,
          banner: '/* eslint-disable no-alert, no-console */',
        },
        client: 'fetch',
        clientType: 'class',
        group: { type: 'tag' },
        pathParamsType: 'object',
      }),
    ],
  },
])
