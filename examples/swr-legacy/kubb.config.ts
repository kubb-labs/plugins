import { adapterOas } from '@kubb/adapter-oas'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck'],
    },
    output: {
      path: './src/gen',
      clean: true,
      barrel: { type: 'named' },
      format: false,
      lint: false,
    },
    adapter: adapterOas({ serverIndex: 0 }),
    plugins: [
      pluginTs({
        output: { path: 'models', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
      // The legacy data-returning client. The hooks render their own inline client that returns
      // `res.data`, bundling the axios runtime into `.kubb/client.ts` plus `.kubb/config.ts`.
      pluginSwr({
        client: 'legacy',
        output: { path: './hooks', barrel: { type: 'named' } },
        group: { type: 'tag' },
      }),
    ],
  }
})
