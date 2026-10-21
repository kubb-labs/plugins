import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
}

const shared: Partial<UserConfig> = {
  platform: 'node',
  sourcemap: true,
  shims: true,
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
    dts: false,
    ...shared,
  },
  {
    // Also builds the CJS JavaScript. `keepNames` stays off the declaration passes: it leaks an untyped `__name` helper into .d.ts/.d.cts files.
    entry,
    format: ['esm', 'cjs'],
    ...shared,
    outputOptions: (options, format, { cjsDts }) => ({ ...options, keepNames: format === 'cjs' && !cjsDts }),
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
  {
    // Declarations for the raw templates so consumers can import their types without `allowImportingTsExtensions`.
    entry: {
      'templates/axios': 'templates/axios.ts',
      'templates/serializers': 'templates/serializers.ts',
      'templates/standardSchema': 'templates/standardSchema.ts',
    },
    format: 'esm',
    fixedExtension: false,
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
