import type { ast, ResolverOverride, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'

/**
 * Validator applied to request and response bodies using schemas from `@kubb/plugin-zod`.
 * - `false`: no validation.
 * - `'zod'`: validates the success (2xx) response body, and the error body when a non-2xx call does
 *   not throw (`throwOnError: false`).
 * - `{ request?: 'zod'; response?: 'zod' }`: opt in per direction. `request` validates the request
 *   body before the call; `response` validates the success response body and,
 *   on the non-throw path, the error body.
 */
export type ValidatorOptions = false | 'zod' | { request?: 'zod'; response?: 'zod' }

/**
 * How the class-based SDK groups operations.
 * - `'tag'`: one class per tag, optionally composed into a root client.
 * - `'flat'`: one class with every operation as a direct method.
 */
export type Mode = 'tag' | 'flat'

/**
 * The resolver shared by the client plugins. Inherits the built-in camelCase `name` and `file`;
 * classes and tag groups use PascalCase (with a `Client` suffix for groups).
 */
export type ResolverClient = Resolver & {
  /**
   * Resolves the generated class name for class-based clients.
   */
  className(this: ResolverClient, name: string): string
  /**
   * Resolves the generated class name for a tag-based client group. The default appends a
   * `Client` suffix (tag `pet` becomes `PetClient`) so the class never collides with the schema
   * model of the same name in the barrel.
   *
   * @example
   * `resolver.groupName('pet') // -> 'PetClient'`
   */
  groupName(this: ResolverClient, name: string): string
  /**
   * Resolves the property name a tag client is exposed under on the composed root SDK
   * (`new PetStore(config).pet`).
   */
  propertyName(this: ResolverClient, name: string): string
}

/**
 * The shared options surface for the client plugins. Deliberately small: there is one
 * response contract and one grouped options object. Each plugin extends this with its own
 * `transport` field.
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
   * Values containing a `${...}` interpolation are emitted as template literals in the generated
   * client config, which keeps runtime environment reads dynamic.
   */
  baseURL?: string
  /**
   * Validate request and response bodies with schemas from `@kubb/plugin-zod`.
   *
   * @default false
   */
  validator?: ValidatorOptions
  /**
   * Generates a class-based SDK instead of the standalone functions. Each tag client is an instance
   * class whose constructor takes a client config and builds its own client, so every environment is
   * a separate instance. Leave `sdk` unset to keep the standalone per-operation functions (the
   * default), which is also what query plugins consume.
   *
   * @example Instance class per tag
   * ```ts
   * pluginFetch({ sdk: {} })
   * // const api = new PetClient({ baseURL: 'https://api.example.com' })
   * // await api.getPetById({ path: { petId: 1 } })
   * ```
   * @example Composed root that instantiates every tag client from one config
   * ```ts
   * pluginFetch({ sdk: { name: 'petStore' } })
   * // class PetStore {
   * //   readonly pet: PetClient
   * //   readonly store: StoreClient
   * //   constructor(config = {}) { ... }
   * // }
   * // const api = new PetStore({ baseURL })
   * // await api.pet.getPetById({ path: { petId: 1 } })
   * ```
   * @example Flat class with every operation as a direct method
   * ```ts
   * pluginFetch({ sdk: { name: 'petStore', mode: 'flat' } })
   * // const api = new PetStore({ baseURL })
   * // await api.getPetById({ path: { petId: 1 } })
   * ```
   */
  sdk?: {
    /**
     * How the SDK groups operations.
     * - `'tag'`: one class per tag. With `name`, a composed root instantiates every tag client.
     * - `'flat'`: one class named by `name`, with every operation as a direct method.
     *
     * @default 'tag'
     */
    mode?: Mode
    /**
     * Name of the generated entry point, also the file name. With `mode: 'tag'` it emits a
     * composed root class that instantiates every tag client from one shared config. With
     * `mode: 'flat'` it names the single class.
     */
    name?: string
  }
  /**
   * Override how names and file paths are built. Methods you omit fall back to the default resolver.
   */
  resolver?: ResolverOverride<ResolverClient> & ThisType<ResolverClient>
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
  validator: NonNullable<Options['validator']>
  sdk:
    | {
        mode: Mode
        name: string | undefined
      }
    | undefined
  resolver: ResolverClient
}

/**
 * The plugin factory type shared by the client plugins. Each concrete plugin (plugin-fetch,
 * plugin-axios, plugin-ky) declares its own name and registers itself; this base ties the shared
 * builders, resolver, and components to one option/resolver shape.
 */
export type PluginContractClient = PluginFactoryOptions<'plugin-contract-client', Options, ResolvedOptions, ResolverClient>
