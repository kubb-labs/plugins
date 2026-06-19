import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  'clients/axios': 'src/clients/axios.ts',
  'clients/fetch': 'src/clients/fetch.ts',
  templates: 'src/templates.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
  // Expose the raw `.ts` templates so consumers can resolve them through
  // `@kubb/plugin-client/templates/**` and copy them into the generated output.
  exports: {
    customExports(exports) {
      exports['./templates/*'] = './templates/*'
      return exports
    },
  },
  deps: {
    neverBundle: [/^@kubb\//],
    alwaysBundle: [/@internals/],
  },
  fixedExtension: false,
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
