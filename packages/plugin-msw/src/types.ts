import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

/**
 * Resolver for MSW that provides naming methods for handler functions.
 */
export type ResolverMsw = Resolver & {
  /**
   * Resolves the base handler function name for an operation.
   */
  resolveName(this: ResolverMsw, name: string): string
  /**
   * Resolves the output file name for an MSW handler module.
   */
  resolvePathName(this: ResolverMsw, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves the handler function name for an operation.
   */
  resolveHandlerName(this: ResolverMsw, node: ast.OperationNode): string
  /**
   * Resolves the exported handlers collection name.
   */
  resolveHandlersName(this: ResolverMsw): string
}

/**
 * Where the generated MSW handlers are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'handlers', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Base URL prepended to every handler's request URL. When omitted, falls back
   * to the adapter's server URL (typically `servers[0].url`).
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
   * Override how handler names and file paths are built.
   */
  resolver?: Partial<ResolverMsw> & ThisType<ResolverMsw>
  /**
   * Macros applied to operation nodes before printing.
   */
  macros?: Array<ast.Macro>
  /**
   * Emit a `handlers.ts` file that re-exports every handler grouped by HTTP method.
   * Drop the file into `setupServer(...handlers)` or `setupWorker(...handlers)`.
   *
   * @default false
   */
  handlers?: boolean
  /**
   * Source of the response body returned by each generated handler.
   * - `'data'` — typed empty/example payload, ready for you to fill in from tests.
   * - `'faker'` — value produced by `@kubb/plugin-faker`.
   *
   * @default 'data'
   */
  parser?: 'data' | 'faker'
  /**
   * Custom generators that run alongside the built-in MSW generators.
   */
  generators?: Array<Generator<PluginMsw>>
}

type ResolvedOptions = {
  output: Output
  group: Group | null
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  parser: NonNullable<Options['parser']>
  baseURL: Options['baseURL'] | undefined
  handlers: boolean
  resolver: ResolverMsw
}

export type PluginMsw = PluginFactoryOptions<'plugin-msw', Options, ResolvedOptions, ResolverMsw>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-msw': PluginMsw
    }
  }
}
