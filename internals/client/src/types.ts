import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

/**
 * Validator applied to request and response bodies using schemas from `@kubb/plugin-zod`.
 * - `false`: no validation.
 * - `'zod'`: validates success (2xx) response bodies only.
 * - `{ request?: 'zod'; response?: 'zod' }`: opt in per direction. `request` validates the request
 *   body and query parameters before the call; `response` validates the success response body.
 */
export type ParserOptions = false | 'zod' | { request?: 'zod'; response?: 'zod' }

/**
 * Selects the generated client shape.
 * - `'function'` — one standalone async function per operation.
 * - `'class'` — one class per tag with instance methods.
 */
export type Shape = 'function' | 'class'

/**
 * The resolver shared by the client plugins. Functions and files use camelCase; URL helpers get
 * a `get<Operation>Url` name.
 */
export type ResolverClient = Resolver & {
  /**
   * Resolves the function name for a raw operation name.
   *
   * @example
   * `resolver.resolveName('show pet by id') // -> 'showPetById'`
   */
  resolveName(this: ResolverClient, name: string): string
  /**
   * Resolves the output file name for a generated client module.
   */
  resolvePathName(this: ResolverClient, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves the generated class name for class-based clients.
   */
  resolveClassName(this: ResolverClient, name: string): string
  /**
   * Resolves the generated class name for a tag-based client group. The default appends a
   * `Client` suffix (tag `pet` becomes `PetClient`) so the class never collides with the schema
   * model of the same name in the barrel.
   *
   * @example
   * `resolver.resolveGroupName('pet') // -> 'PetClient'`
   */
  resolveGroupName(this: ResolverClient, name: string): string
  /**
   * Resolves the SDK facade property name for a client class.
   */
  resolveClientPropertyName(this: ResolverClient, name: string): string
}

/**
 * The shared options surface for the client plugins. Deliberately small: there is one
 * response contract and one grouped options object, so the knobs that drove plugin-client's
 * combinatorial code paths are gone. Each plugin extends this with its own `transport` field.
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
   * Base URL prepended to every request. When omitted, falls back to the adapter's server URL.
   */
  baseURL?: string
  /**
   * Validate request and response bodies with schemas from `@kubb/plugin-zod`.
   *
   * @default false
   */
  parser?: ParserOptions
  /**
   * Configures the generated SDK: its shape and, optionally, a single facade class composing
   * every tag-based client into one entry point.
   *
   * @example Class-per-tag clients
   * `sdk: { shape: 'class' }`
   * @example A single facade composing every tag client
   * ```ts
   * pluginFetch({
   *   sdk: { shape: 'class', name: 'PetStoreSDK' },
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
     * Shape of the generated client.
     * - `'function'` — one standalone async function per operation.
     * - `'class'` — one class per tag with instance methods.
     *
     * Defaults to `'class'` when `name` is set, otherwise `'function'`.
     *
     * @note Only `'function'` is compatible with query plugins.
     */
    shape?: Shape
    /**
     * Name of the generated SDK facade class that composes every tag-based client. Also the file
     * name. Only emitted for the `'class'` shape.
     */
    name?: string
  }
  /**
   * Override how names and file paths are built. Methods you omit fall back to the default resolver.
   */
  resolver?: Partial<ResolverClient> & ThisType<ResolverClient>
  /**
   * Macros applied to each operation node before code is printed.
   */
  macros?: Array<ast.Macro>
}

/**
 * The resolved options after defaults are applied.
 */
export type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  baseURL: Options['baseURL']
  parser: NonNullable<Options['parser']>
  sdk: {
    shape: Shape
    name: string | undefined
  }
  resolver: ResolverClient
}

/**
 * The plugin factory type shared by the client plugins. Each concrete plugin (plugin-fetch,
 * plugin-axios, plugin-ky) declares its own name and registers itself; this base ties the shared
 * builders, resolver, and components to one option/resolver shape.
 */
export type PluginContractClient = PluginFactoryOptions<'plugin-contract-client', Options, ResolvedOptions, ResolverClient>
