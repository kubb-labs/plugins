import { adapterOas } from '@kubb/adapter-oas'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

export default defineConfig(() => {
  // openDevtools()

  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    adapter: adapterOas({ validate: false }),
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome check --fix --unsafe ./src'],
    },
    output: {
      path: './src/gen',
      clean: true,
      extension: {
        '.ts': '.js',
      },
    },
    plugins: [
      pluginTs({
        output: { path: 'models/ts' },
        compatibilityPreset: 'kubbV4',
      }),
      pluginZod({
        compatibilityPreset: 'kubbV4',
      }),
      pluginMcp({
        compatibilityPreset: 'kubbV4',
        client: {
          baseURL: 'https://petstore.swagger.io/v2',
          importPath: '../../client.ts',
        },
      }),
    ],
  }
})
