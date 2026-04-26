import { pluginTs } from '@kubb/plugin-ts'
import { pluginValibot } from '@kubb/plugin-valibot'
import { defineConfig } from 'kubb'

export default defineConfig([
  {
    name: 'valibot',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/valibot',
      clean: true,
    },
    hooks: {},
    plugins: [
      pluginTs({
        output: {
          path: './ts',
        },
      }),
      pluginValibot({
        output: {
          path: './valibot',
        },
        operations: true,
        inferred: true,
      }),
    ],
  },
  {
    name: 'valibot-union',
    root: '.',
    input: {
      path: './unionWithReadOnly.yaml',
    },
    output: {
      path: './src/gen3',
      clean: true,
    },
    plugins: [
      pluginValibot({
        output: {
          path: './valibot',
        },
      }),
    ],
  },
])
