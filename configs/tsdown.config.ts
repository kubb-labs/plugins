import { defineConfig, type UserConfig } from 'tsdown'

type Options = {
  neverBundle?: Array<string | RegExp>
  /**
   * Raw templates under `templates/`, named without `.ts`, that get declarations of their own.
   */
  templates?: Array<string>
  templatePlugins?: UserConfig['plugins']
}

const dts = { dtsOnly: true, tsconfig: '../../tsconfig.dts.json' }

/**
 * The tsdown build every plugin package shares. `neverBundle` adds to `@kubb/*`.
 */
export function definePluginConfig({ neverBundle = [], templates = [], templatePlugins }: Options = {}) {
  const entry = { index: 'src/index.ts' }
  const shared: Partial<UserConfig> = {
    platform: 'node',
    sourcemap: true,
    shims: true,
    deps: {
      neverBundle: [/^@kubb\//, ...neverBundle],
      alwaysBundle: [/@internals/],
    },
    fixedExtension: false,
    outputOptions: {
      keepNames: true,
    },
  }

  return defineConfig([
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
      dts,
    },
    ...(templates.length
      ? [
          {
            entry: Object.fromEntries(templates.map((name) => [`templates/${name}`, `templates/${name}.ts`])),
            format: 'esm' as const,
            fixedExtension: false,
            plugins: templatePlugins,
            dts,
          },
        ]
      : []),
  ])
}
