import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './openapi.yaml',
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginTs(),
  ],
})
