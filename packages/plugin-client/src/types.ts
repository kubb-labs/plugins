import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

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
}

/**
 * Use either a preset `client` type OR a custom `importPath`, not both.
 * `importPath` overrides the bundled `client` preset when provided. These options are mutually
 * exclusive.
 */
export type ClientImportPath =
  | {
      /**
       * HTTP client bundled into the generated output.
       * - `'axios'` — emits the axios client into `.kubb/client.ts`. Requires `axios` at runtime.
       * - `'fetch'` — emits the fetch client into `.kubb/client.ts`. Uses the global `fetch`.
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
       * instead of the bundled `client`. Accepts both relative paths and bare module specifiers;
       * the value is used as-is.
       *
       * @note The module must implement the `RequestResult` contract: a `client` value plus the
       * `Options` and `RequestResult` types (and `ClientInstance` / `RequestConfig` for the class
       * client types).
       */
      importPath: string
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
   * Base URL prepended to every request. When omitted, falls back to the adapter's
   * server URL (typically `servers[0].url`).
   */
  baseURL?: string
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
   * Macros applied to each operation node before code is printed.
   * Return `null` or `undefined` from a callback to leave the node unchanged.
   */
  macros?: Array<ast.Macro>
} & ClientImportPath

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  client: Options['client']
  clientType: NonNullable<Options['clientType']>
  parser: NonNullable<Options['parser']>
  importPath: Options['importPath']
  baseURL: Options['baseURL']
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
