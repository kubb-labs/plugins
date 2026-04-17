import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { defineConfig } from 'kubb'
import { example1 } from './src/generators/example1'
import { example2 } from './src/generators/example2'
import { example3 } from './src/generators/example3'

const input = { path: './petStore.yaml' } as const

export default defineConfig([
  {
    root: '.',
    input,
    adapter: adapterOas({ validate: false }),
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [
      pluginClient({
        output: { path: './example1.ts' },
        generators: [example1],
      }),
    ],
  },
  {
    root: '.',
    input,
    adapter: adapterOas({ validate: false }),
    output: { path: './src/gen2' },
    plugins: [
      pluginClient({
        output: { path: './example2.ts' },
        generators: [example2],
      }),
    ],
  },
  {
    root: '.',
    input,
    adapter: adapterOas({ validate: false }),
    output: { path: './src/gen3' },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    plugins: [
      pluginClient({
        output: { path: './example3.tsx' },
        generators: [example3],
      }),
    ],
  },
])
