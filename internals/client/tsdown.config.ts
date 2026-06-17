import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  'templates/runtime.source': 'src/templates/runtime.source.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  exports: true,
  fixedExtension: false,
  deps: {
    neverBundle: [/^@kubb\//],
    alwaysBundle: [/@internals/],
  },
  outputOptions: {
    keepNames: true,
  },
}

export default defineConfig([
  {
    entry,
    format: 'esm',
    dts: true,
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
])
