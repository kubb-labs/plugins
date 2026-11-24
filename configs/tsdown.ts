import type { UserConfig } from 'tsdown'

const entry = { index: 'src/index.ts' }

/**
 * The two builds every plugin package has: the ESM JavaScript, then the CJS JavaScript with the declarations of both formats.
 * `deps` replaces the default, which keeps `@kubb/*` external and bundles `@internals/*`.
 */
export function packageBuilds({ deps = { neverBundle: [/^@kubb\//], alwaysBundle: [/@internals/] } }: Pick<UserConfig, 'deps'> = {}): Array<UserConfig> {
  const shared: Partial<UserConfig> = { platform: 'node', sourcemap: true, shims: true, deps, fixedExtension: false }

  return [
    { entry, format: 'esm', dts: false, ...shared, outputOptions: { keepNames: true } },
    {
      // `keepNames` stays off the declaration passes: it leaks an untyped `__name` helper into .d.ts/.d.cts files.
      entry,
      format: ['esm', 'cjs'],
      ...shared,
      outputOptions: (options, format, { cjsDts }) => ({ ...options, keepNames: format === 'cjs' && !cjsDts }),
      dts: { dtsOnly: true, tsconfig: '../../tsconfig.dts.json' },
    },
  ]
}
