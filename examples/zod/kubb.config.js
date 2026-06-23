import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { pluginZodOperations } from './operationsPlugin.ts'

export default defineConfig([
  {
    name: 'zod',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/zod',
      clean: true,
    },
    hooks: {},
    plugins: [
      pluginTs({
        output: {
          path: './ts',
        },
      }),
      pluginZod({
        output: {
          path: './zod',
        },
        importPath: '../../zod.ts',
        inferred: true,
      }),
      pluginZodOperations(),
    ],
  },
  {
    name: 'zod-mini',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/mini',
      clean: true,
    },
    plugins: [
      pluginZod({
        output: {
          path: './zod',
        },
        mini: true,
      }),
    ],
  },
  {
    name: 'zod-union',
    root: '.',
    input: {
      path: './unionWithReadOnly.yaml',
    },
    output: {
      path: './src/gen3',
      clean: true,
    },
    plugins: [
      pluginZod({
        output: {
          path: './zod',
        },
      }),
    ],
  },
])
