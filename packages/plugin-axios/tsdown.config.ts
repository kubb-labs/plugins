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

// The `./core.ts` stub next to the template re-exports `@kubb/plugin-client` with `export *`, which the declaration bundler
// turns into an undeclared namespace, so the shared templates resolve to the package directly.
const sharedTemplates = {
  name: 'shared-templates',
  resolveId: {
    order: 'pre' as const,
    handler(source: string) {
      const match = /^\.\/(core|serializers|standardSchema)\.ts$/.exec(source)
      return match ? { id: `@kubb/plugin-client/templates/${match[1]}.ts`, external: true } : null
    },
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
      'templates/client': 'templates/client.ts',
    },
    format: 'esm',
    fixedExtension: false,
    plugins: [sharedTemplates],
    dts: { emitDtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
  },
])
