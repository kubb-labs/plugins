import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: 'esm',
  platform: 'node',
  sourcemap: true,
  dts: false,
  deps: {
    neverBundle: [/^@kubb\//],
  },
  fixedExtension: false,
})
