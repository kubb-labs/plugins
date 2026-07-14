import { adapterOas } from '@kubb/adapter-oas'
import { pluginEffect } from '@kubb/plugin-effect'
import { pluginEffectHttpApiClient } from '@kubb/plugin-effect-httpapiclient'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  root: '.',
  input: './petStore.yaml',
  adapter: adapterOas({ unknownType: 'unknown', dateType: 'date' }),
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginEffect({ output: { path: 'effect', barrel: { type: 'named' } } }),
    pluginEffectHttpApiClient({
      output: { path: 'effectHttpApiClient', barrel: { type: 'named' } },
      baseURL: 'https://petstore.swagger.io/v2',
    }),
  ],
})
