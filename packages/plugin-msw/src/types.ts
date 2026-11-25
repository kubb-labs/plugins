import type { ast } from '@internals/ast'
import type { PluginOptions, ResolvedPluginOptions } from '@internals/shared/types'
import type { PluginType, Resolver, ResolverInput } from '@kubb/kit'

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
 * Where the generated MSW handlers are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'handlers', barrel: { type: 'named' } }
 */
export type Options = PluginOptions<ResolvedOptions> & {
  /**
   * Base URL prepended to every handler's request URL. A `${...}` expression runs at runtime.
   * Pass `{ baseURL }` as a handler's second argument to override it per call.
   *
   * @note Leave off the trailing slash. Operation paths already start with `/`.
   */
  baseURL?: string
  /**
   * Override how handler names and file paths are built.
   */
  resolver?: ResolverInput<ResolverMsw>
  /**
   * Macros applied to operation nodes before printing.
   */
  macros?: Array<ast.Macro>
  /**
   * Emit a `handlers.ts` file with every handler in operation order, as `handlers` and as
   * `createHandlers({ baseURL })` for a runtime base URL.
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
  /**
   * Encoders for response bodies, keyed by media type. A response whose mocked content type matches a key sends
   * `name(data)` as its body, and the handler file imports `name` from `path`. Other responses keep the built-in body.
   *
   * @example
   * ```ts
   * mediaTypes: { 'application/vnd.acme.stream+json': { name: 'encodeStream', path: '@acme/runtime' } }
   * ```
   */
  mediaTypes?: Record<string, MediaTypeEncoder>
}

/**
 * A function that turns the mocked `data` into a response body, and the module the handler file imports it from.
 */
export type MediaTypeEncoder = {
  /**
   * Name of the exported function. It gets the handler's `data`, which is `undefined` when a mock has none, and
   * returns a body the `Response` constructor accepts, such as a string or a `ReadableStream`.
   */
  name: string
  /**
   * Import path, written to the handler file as it is. Use a package name or a path alias.
   */
  path: string
}

export type ResolvedOptions = ResolvedPluginOptions<ResolvedOptions> & {
  parser: NonNullable<Options['parser']>
  baseURL: Options['baseURL'] | undefined
  handlers: boolean
  mediaTypes: NonNullable<Options['mediaTypes']>
}

export type PluginMsw = PluginType<'plugin-msw', Options, ResolvedOptions, ResolverMsw>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-msw': PluginMsw
    }
  }
}
