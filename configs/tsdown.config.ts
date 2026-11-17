import { defineConfig, type UserConfig } from 'tsdown'

type Options = {
  /**
   * Packages to leave out of the bundle, next to `@kubb/*`.
   */
  neverBundle?: Array<string | RegExp>
  /**
   * Raw templates under `templates/`, named without `.ts`, that get their own declarations, so consumers can import
   * their types without `allowImportingTsExtensions`.
   */
  templates?: Array<string>
  /**
   * Plugins for the template declaration build.
   */
  templatePlugins?: UserConfig['plugins']
}

const dts = { dtsOnly: true, tsconfig: '../../tsconfig.dts.json' }

/**
 * The tsdown build every plugin package shares: ESM and CJS JavaScript with their declarations from `src/index.ts`.
 *
 * @example
 * ```ts
 * export default definePluginConfig({ neverBundle: ['@types/react'] })
 * ```
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
