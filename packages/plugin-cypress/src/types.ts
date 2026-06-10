import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

/**
 * Resolver for Cypress that provides naming methods for test functions.
 */
export type ResolverCypress = Resolver & {
  /**
   * Resolves the function name for an operation.
   *
   * @example Resolving function names
   * `resolver.resolveName('show pet by id') // -> 'showPetById'`
   */
  resolveName(this: ResolverCypress, name: string): string
  /**
   * Resolves the output file name for a Cypress request module.
   */
  resolvePathName(this: ResolverCypress, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
}

/**
 * Parameter handling mode that determines how path params and query/body params are arranged in function signatures.
 */
type ParamsTypeOptions =
  | {
      /**
       * Every operation parameter is wrapped in a single destructured object argument.
       */
      paramsType: 'object'
      /**
       * `pathParamsType` has no effect when `paramsType` is `'object'`.
       */
      pathParamsType?: never
    }
  | {
      /**
       * Each parameter group is emitted as a separate positional function argument.
       */
      paramsType?: 'inline'
      /**
       * How URL path parameters are arranged inside the inline argument list.
       * - `'object'` groups them into one destructured object.
       * - `'inline'` emits each path param as its own argument.
       *
       * @default 'inline'
       */
      pathParamsType?: 'object' | 'inline'
    }

/**
 * Where the generated Cypress helpers are written and how they are exported, plus the optional
 * `group` strategy. With `output.mode: 'group'` the `group` option is required.
 *
 * @default { path: 'cypress', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Shape of the value returned from each helper.
   * - `'data'` — only the response body.
   * - `'full'` — the full Cypress response object (headers, status, body).
   *
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  /**
   * Rename parameter properties in the generated helpers (path, query, headers).
   *
   * @note Must match the value of `paramsCasing` on `@kubb/plugin-ts`.
   */
  paramsCasing?: 'camelcase'
  /**
   * Base URL prepended to every request URL. When omitted, falls back to the
   * adapter's server URL (typically `servers[0].url`).
   */
  baseURL?: string
  /**
   * Skip operations matching at least one entry in the list.
   */
  exclude?: Array<Exclude>
  /**
   * Restrict generation to operations matching at least one entry in the list.
   */
  include?: Array<Include>
  /**
   * Apply a different options object to operations matching a pattern.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Override how helper names and file paths are built.
   */
  resolver?: Partial<ResolverCypress> & ThisType<ResolverCypress>
  /**
   * AST visitor applied to each operation node before printing.
   */
  transformer?: ast.Visitor
  /**
   * Custom generators that run alongside the built-in Cypress generators.
   */
  generators?: Array<Generator<PluginCypress>>
} & ParamsTypeOptions

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  baseURL: Options['baseURL'] | undefined
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<NonNullable<Options['pathParamsType']>>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
  resolver: ResolverCypress
}

export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, ResolverCypress>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-cypress': PluginCypress
    }
  }
}
