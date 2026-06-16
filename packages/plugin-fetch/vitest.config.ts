import { defineConfig } from 'vitest/config'
import { importAttributeTextPlugin } from '../../configs/importAttributeTextPlugin.ts'

export default defineConfig({
  plugins: [importAttributeTextPlugin()],
  test: {
    dir: './src',
  },
  resolve: {
    tsconfigPaths: true,
  },
})
