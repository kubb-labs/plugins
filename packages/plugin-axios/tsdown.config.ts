import { defineConfig, type UserConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
}

const templateEntry = {
  axios: 'templates/axios.ts',
  serializers: 'templates/serializers.ts',
  standardSchema: 'templates/standardSchema.ts',
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
    dts: true,
    ...shared,
  },
  {
    entry,
    format: 'cjs',
    dts: false,
    ...shared,
  },
  {
    // Declarations for the copied runtime templates, so `@kubb/plugin-axios/templates/*` types
    // resolve without the consumer type-checking the raw `.ts` sources.
    ...shared,
    entry: templateEntry,
    format: 'esm',
    dts: { emitDtsOnly: true },
    outDir: 'dist/templates',
    clean: false,
    // Declarations only: no `__name` helper import pointing at a runtime chunk this build does not emit.
    outputOptions: {},
  },
])
