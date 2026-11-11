import type { ast, ResolverPatch, Exclude, Group, Include, Output, OutputOptions, Override, PluginType, Resolver } from '@kubb/kit'

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
 * Arguments passed to the `responseBody` option, once per response of an operation.
 */
export type ResponseBodyContext = {
  /**
   * The operation the handler is generated for.
   */
  node: ast.HttpOperationNode
  /**
   * The response the body is written for.
   */
  response: ast.ResponseNode
  /**
   * The response's status code as a number, such as `200`.
   */
  status: number
}

/**
 * A custom response body returned by the `responseBody` option.
 */
export type ResponseBody = {
  /**
   * Returns the body expression passed to `new HttpResponse(...)`. `data` is the source of the
   * value to send, such as `'data'`, or `'data ?? createPetResponse(data)'` with `parser: 'faker'`.
   *
   * @example
   * ```ts
   * expression: (data) => `encodeStream(${data})`
   * ```
   */
  expression: (data: string) => string
  /**
   * Imports the expression needs, added to the handler file as written.
   *
   * @example
   * `[{ name: ['encodeStream'], path: '@acme/runtime' }]`
   */
  imports?: Array<{ name: ast.ImportNode['name']; path: string; isTypeOnly?: boolean }>
}

/**
 * Where the generated MSW handlers are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'handlers', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Base URL prepended to every handler's request URL. A `${...}` expression runs at runtime.
   * Pass `{ baseURL }` as a handler's second argument to override it per call.
   *
   * @note Leave off the trailing slash. Operation paths already start with `/`.
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
  resolver?: ResolverPatch<ResolverMsw>
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
   * Replace the response body of an operation's response helpers and handler. Called once per
   * response with a status code. Return `undefined` to keep the default `JSON.stringify(data)` body.
   */
  responseBody?: (context: ResponseBodyContext) => ResponseBody | undefined
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
  responseBody: Options['responseBody']
}

export type PluginMsw = PluginType<'plugin-msw', Options, ResolvedOptions, ResolverMsw>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-msw': PluginMsw
    }
  }
}
