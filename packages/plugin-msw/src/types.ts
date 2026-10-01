import type { ast, ResolverPatch, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'

/**
 * Resolver for MSW that provides naming methods for handler functions.
 */
export type ResolverMsw = Resolver & {
  /**
   * Naming for generated MSW handlers.
   */
  handler: {
    /**
     * Resolves the handler function name for an operation.
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the exported handlers collection name.
     */
    listName(): string
  }
}

/**
 * A function that returns the base URL, imported into every handler file and called when a handler
 * is created. Use it to read the base URL at runtime, for example from your API client's config.
 *
 * The function can return `string` or `string | undefined`. When returning `undefined` or an empty string,
 * the handler falls back to matching relative paths.
 *
 * @note Base URLs should not include a trailing slash, as OpenAPI operation paths already begin with `/`.
 * @note When `group` is enabled, module aliases (e.g. `'@/client'`) or package specifiers are recommended
 * over relative paths, as `importPath` is written verbatim into handlers across different subdirectory depths.
 *
 * @example
 * `{ importPath: '../client', name: 'getBaseURL' }` emits `import { getBaseURL } from '../client'`.
 */
export type BaseURLImport = {
  /**
   * Module specifier, written verbatim into the import.
   */
  importPath: string
  /**
   * Named export of a `() => string | undefined` or `() => string` function.
   */
  name: string
}

/**
 * Where the generated MSW handlers are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'handlers', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Base URL prepended to every handler's request URL: a fixed string (e.g. `'https://api.example.com'`),
   * a dynamic template string (e.g. `'${process.env.API_URL}'`), or a function imported from a module
   * and called when the handler is created.
   *
   * A handler also takes `{ baseURL }` as its second argument, which overrides this option per call:
   * `listPetsHandler(undefined, { baseURL: 'https://staging.example.com' })`.
   *
   * @note Do not include a trailing slash in the base URL, as OpenAPI operation paths already begin with `/`.
   */
  baseURL?: string | BaseURLImport
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
  resolver?: ResolverPatch<ResolverMsw>
  /**
   * Macros applied to operation nodes before printing.
   */
  macros?: Array<ast.Macro>
  /**
   * Emit a `handlers.ts` file that re-exports every handler in operation order.
   * Drop the file into `setupServer(...handlers)` or `setupWorker(...handlers)`.
   *
   * @default false
   */
  handlers?: boolean
  /**
   * Source of the response body returned by each generated handler.
   * - `'data'`: typed empty/example payload, ready for you to fill in from tests.
   * - `'faker'`: value produced by `@kubb/plugin-faker`.
   *
   * @default 'data'
   */
  parser?: 'data' | 'faker'
}

export type ResolvedOptions = {
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
