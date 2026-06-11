import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

/**
 * The concrete resolver type for `@kubb/plugin-client`.
 * Extends the base `Resolver` with a `resolveName` helper for client function names.
 */
export type ResolverClient = Resolver & {
  /**
   * Resolves the function name for a given raw operation name.
   *
   * @example Resolving operation names
   * `resolver.resolveName('show pet by id') // -> 'showPetById'`
   */
  resolveName(this: ResolverClient, name: string): string
  /**
   * Resolves the output file name for a client module.
   */
  resolvePathName(this: ResolverClient, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves the generated class name for class-based clients.
   */
  resolveClassName(this: ResolverClient, name: string): string
  /**
   * Resolves the generated class name for tag-based client groups. The default
   * appends a `Client` suffix (tag `pet` becomes `PetClient`) so the class never
   * collides with the schema model of the same name in the barrel.
   *
   * @example Resolving tag-group class names
   * `resolver.resolveGroupName('pet') // -> 'PetClient'`
   */
  resolveGroupName(this: ResolverClient, name: string): string
  /**
   * Resolves the generated SDK facade property name for a client class.
   */
  resolveClientPropertyName(this: ResolverClient, name: string): string
  /**
   * Resolves the URL helper function name for an operation.
   *
   * @example Resolving URL helper names
   * `resolver.resolveUrlName(node) // -> 'getShowPetByIdUrl'`
   */
  resolveUrlName(this: ResolverClient, node: ast.OperationNode): string
}

/**
 * Use either a preset `client` type OR a custom `importPath`, not both.
 * `importPath` will override the default `client` preset when both are provided.
 * These options are mutually exclusive. `bundle` and `importPath` are also
 * mutually exclusive since `bundle` only has effect when `importPath` is not set.
 */
export type ClientImportPath =
  | {
      /**
       * HTTP client used by the generated code.
       * - `'axios'` — imports from `@kubb/plugin-client/clients/axios`. Requires `axios` at runtime.
       * - `'fetch'` — imports from `@kubb/plugin-client/clients/fetch`. Uses the global `fetch`.
       *
       * @default 'axios'
       */
      client?: 'axios' | 'fetch'
      importPath?: never
    }
  | {
      client?: never
      /**
       * Path to a custom client module. Generated files import their HTTP runtime from here
       * instead of `@kubb/plugin-client/clients/{client}`. Accepts both relative paths and
       * bare module specifiers; the value is used as-is.
       *
       * @note When combined with a query plugin, the module must export `Client`,
       * `RequestConfig`, and `ResponseErrorConfig` types.
       */
      importPath: string
      /**
       * `bundle` has no effect when `importPath` is set.
       * Use either `bundle` (with `client`) or `importPath`, not both.
       */
      bundle?: never
    }

/**
 * Discriminated union that ties `pathParamsType` to the `paramsType` values where it is meaningful.
 *
 * - `paramsType: 'object'` — all parameters (including path params) are merged into a single
 *   destructured object. `pathParamsType` is never reached in this code path and has no effect.
 * - `paramsType?: 'inline'` (or omitted) — each parameter group is a separate function argument.
 *   `pathParamsType` controls whether the path-param group itself is destructured (`'object'`)
 *   or spread as individual arguments (`'inline'`).
 */
type ParamsTypeOptions =
  | {
      /**
       * Every operation parameter (path, query, headers, body) is wrapped in a single
       * destructured object argument.
       */
      paramsType: 'object'
      /**
       * `pathParamsType` has no effect when `paramsType` is `'object'`.
       * Path params already live inside the single destructured object.
       */
      pathParamsType?: never
    }
  | {
      /**
       * Each parameter group is emitted as a separate positional function argument.
       *
       * @default 'inline'
       */
      paramsType?: 'inline'
      /**
       * How URL path parameters are arranged inside the inline argument list.
       * - `'object'` groups them into one destructured object: `{ petId }: PathParams`.
       * - `'inline'` emits each path param as its own argument: `petId: string`.
       *
       * @default 'inline'
       */
      pathParamsType?: 'object' | 'inline'
    }

/**
 * Where the generated client files are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'clients', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
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
   * Emit an `operations.ts` file that re-exports every generated function grouped by HTTP method.
   *
   * @default false
   */
  operations?: boolean
  /**
   * Whether to also export the URL builder helpers (`get<Operation>Url`).
   * - `'export'` exposes them via the barrel.
   * - `false` keeps them private.
   *
   * @default false
   */
  urlType?: 'export' | false
  /**
   * Base URL prepended to every request. When omitted, falls back to the adapter's
   * server URL (typically `servers[0].url`).
   */
  baseURL?: string
  /**
   * Shape of the value returned by each generated client function.
   * - `'data'` — only the response body.
   * - `'full'` — the full response as a discriminated union keyed by HTTP status code.
   *   Each member is `{ status: N; data: StatusNType; statusText: string }`,
   *   so narrowing on `res.status` also narrows `res.data` to the matching response type.
   *
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  /**
   * Whether the runtime client throws for responses outside the 2xx range.
   * - `true` (default): a resolved call always means success. Generated types and zod
   *   parsing only cover success (2xx) responses; error shapes surface through
   *   `ResponseErrorConfig` on the thrown error.
   * - `false`: every response resolves. Generated types and zod parsing cover every
   *   documented status, so narrowing on `status` is up to the caller.
   *
   * @default true
   */
  throwOnError?: boolean
  /**
   * Rename parameter properties in the generated client (path, query, headers).
   * The HTTP request still uses the original spec names; Kubb writes the mapping for you.
   *
   * @note Use the same value on `@kubb/plugin-ts` so types stay compatible.
   */
  paramsCasing?: 'camelcase'
  /**
   * Validator applied to request and response bodies using schemas from `@kubb/plugin-zod`.
   * - `false` (default): no validation. The response is returned as-is.
   * - `'zod'`: validates response bodies only (backward-compatible shorthand).
   * - `{ request?: 'zod'; response?: 'zod' }`: opt in per direction. `request` validates the
   *   request body and query parameters before the call. `response` validates the response body.
   *
   * @default false
   * @example Response only (shorthand)
   * `parser: 'zod'`
   * @example Both directions
   * `parser: { request: 'zod', response: 'zod' }`
   */
  parser?: false | 'zod' | { request?: 'zod'; response?: 'zod' }
  /**
   * Shape of the generated client.
   * - `'function'` — one standalone async function per operation.
   * - `'class'` — one class per tag with instance methods.
   * - `'staticClass'` — one class per tag with static methods.
   *
   * @default 'function'
   * @note Only `'function'` is compatible with query plugins.
   */
  clientType?: 'function' | 'class' | 'staticClass'
  /**
   * Copy the HTTP client runtime into the generated output so consumers do not need
   * `@kubb/plugin-client` at runtime. When `false`, generated files import from
   * `@kubb/plugin-client/clients/{client}`.
   *
   * @default false
   */
  bundle?: boolean
  /**
   * Generate a single SDK class composing every tag-based client into one entry point.
   * Automatically enables `clientType: 'class'`.
   *
   * @example
   * ```ts
   * pluginClient({
   *   sdk: { className: 'PetStoreSDK' },
   * })
   * // class PetStoreSDK {
   * //   readonly petClient: PetClient
   * //   readonly storeClient: StoreClient
   * //   constructor(config = {}) { ... }
   * // }
   * ```
   */
  sdk?: {
    /**
     * Name of the generated SDK facade class. Also the file name.
     */
    className: string
  }
  /**
   * Override how names and file paths are built for the generated client.
   * Methods you omit fall back to the default resolver. `this` is bound to the
   * full resolver, so `this.default(name)` delegates to the built-in implementation.
   */
  resolver?: Partial<ResolverClient> & ThisType<ResolverClient>
  /**
   * AST visitor applied to each operation node before code is printed.
   * Return `null` or `undefined` to leave the node unchanged.
   */
  transformer?: ast.Visitor
  /**
   * Custom generators that run alongside the built-in client generators.
   */
  generators?: Array<Generator<PluginClient>>
} & ClientImportPath &
  ParamsTypeOptions

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  client: Options['client']
  clientType: NonNullable<Options['clientType']>
  bundle: NonNullable<Options['bundle']>
  parser: NonNullable<Options['parser']>
  urlType: NonNullable<Options['urlType']>
  importPath: Options['importPath']
  baseURL: Options['baseURL']
  dataReturnType: NonNullable<Options['dataReturnType']>
  throwOnError: NonNullable<Options['throwOnError']>
  pathParamsType: NonNullable<NonNullable<Options['pathParamsType']>>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
  sdk: Options['sdk']
  resolver: ResolverClient
}

export type PluginClient = PluginFactoryOptions<'plugin-client', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-client': PluginClient
    }
  }
}
