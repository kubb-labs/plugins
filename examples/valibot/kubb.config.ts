import { adapterOas } from '@kubb/adapter-oas'
import { pluginValibot } from '@kubb/plugin-valibot'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  root: '.',
  input: './petStore.yaml',
  adapter: adapterOas({ unknownType: 'unknown' }),
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginValibot({
      output: {
        path: './valibot',
        mode: 'directory',
      },
      inferred: true,
    }),
  ],
})
