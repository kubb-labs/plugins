import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

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
    hooks: {
      // done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
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
        operations: true,
        importPath: '../../zod.ts',
        inferred: true,
      }),
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
