import { adapterOas } from '@kubb/adapter-oas'
import { pluginEffect } from '@kubb/plugin-effect'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  root: '.',
  input: '../zod/petStore.yaml',
  adapter: adapterOas({ unknownType: 'unknown', dateType: 'date' }),
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [pluginEffect()],
})
