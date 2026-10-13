import { adapterOas } from '@kubb/adapter-oas'
import { pluginPlaywright } from '@kubb/plugin-playwright'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: './petStore.yaml',
  adapter: adapterOas(),
  output: { path: './src/gen' },
  plugins: [pluginTs(), pluginPlaywright()],
})
