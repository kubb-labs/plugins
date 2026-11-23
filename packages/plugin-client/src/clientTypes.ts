import type { ast } from '@internals/ast'
import type { ReturnTypeOption } from '@internals/client'
import type { PluginOptions } from '@internals/shared/types'
import type { Exclude, Group, Include, Output, Override, PluginType, Resolver, ResolverInput } from '@kubb/kit'

/**
 * The schema library a validator reads its schemas from: `@kubb/plugin-zod` or `@kubb/plugin-valibot`.
 */
export type ValidatorLibrary = 'zod' | 'valibot'

type ValidatorSlots<TLibrary extends ValidatorLibrary> = { request?: TLibrary; params?: TLibrary; response?: TLibrary }

/**
 * Validator applied to the request and response using schemas from `@kubb/plugin-zod` or `@kubb/plugin-valibot`.
 * - `false`: no validation.
 * - `'zod'` or `'valibot'`: validates the success (2xx) response body, and the error body of a non-2xx call,
 *   whether it throws or returns the error.
 * - `{ request?, params?, response? }`: opt in per slot, with one library for every slot. `request` checks the
 *   request body before the call; `params` validate the path, query, and header params; `response` validates
 *   the success response body and the error body.
 */
export type ValidatorOptions = false | ValidatorLibrary | ValidatorSlots<'zod'> | ValidatorSlots<'valibot'>

/**
 * How the class-based SDK groups operations.
 * - `'tag'`: one class per tag, optionally composed into a root client.
 * - `'flat'`: one class with every operation as a direct method.
 */
export type Mode = 'tag' | 'flat'

/**
 * How generated functions take the `auth` option.
 * - `'optional'`: every function takes `auth` as an optional option.
 * - `'required'`: a function whose operation needs a token takes `auth` as a required option.
 */
export type AuthMode = 'optional' | 'required'

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
export type ClientOptions = PluginOptions<Omit<ClientResolvedOptions, 'throwOnErrorDefault'>> & {
  /**
   * Base URL prepended to every request. When omitted, the generated client sets no base URL, so set one at runtime with
   * `client.setConfig({ baseURL })`. The top-level server URL is not used, but an operation with path-level or operation-level `servers` calls it.
   * Values containing a `${...}` interpolation are emitted as template literals in the generated client config, which keeps
   * runtime environment reads dynamic.
   */
  baseURL?: string
  /**
   * Import specifier of a module the generated operations import the client runtime from, written exactly as given.
   * Kubb still writes the `.kubb/` runtime, so the module can re-export it with its own `client` or types.
   * It must resolve from the generated file, so use a relative path, a package name, or an alias.
   *
   * @example
   * ```ts
   * pluginFetch({ importPath: '../../client' }) // src/client.ts re-exports './gen/.kubb/client.ts'
   * ```
   */
  importPath?: string
  /**
   * Default error behavior for generated operations and their client. Per-call `throwOnError`
   * takes precedence.
   *
   * @default true
   */
  throwOnErrorDefault?: boolean
  /**
   * Validate the request body, the request params, and the response with schemas from `@kubb/plugin-zod` or
   * `@kubb/plugin-valibot`.
   *
   * @default false
   */
  validator?: ValidatorOptions
  /**
   * How generated functions take the `auth` option. SDK classes take `auth` in their constructor and ignore it.
   *
   * @example Make `auth` required on operations that need a token
   * ```ts
   * pluginFetch({ auth: { mode: 'required' } })
   * // await addPet({ body, auth: () => getToken() })
   * // await addPet({ body }) // Type error: `auth` is missing
   * ```
   */
  auth?: {
    /**
     * Whether a generated function takes `auth` as an optional or a required option.
     * - `'optional'`: every function takes `auth` as an optional option.
     * - `'required'`: a function whose operation needs a token takes `auth` as a required option. An operation
     *   without `security`, or one that allows `{}`, keeps it optional.
     *
     * @default 'optional'
     */
    mode?: AuthMode
  }
  /**
   * Shape of the value a generated operation function resolves to. Applies to the standalone
   * functions and the class-based SDK. The query-hook plugins (`@kubb/plugin-react-query`,
   * `@kubb/plugin-vue-query`, `@kubb/plugin-swr`) and `@kubb/plugin-mcp` read it to unwrap the
   * call they make, and their own `returnType` sets what a hook resolves to.
   *
   * @default 'full'
   * @example
   * ```ts
   * pluginAxios({ returnType: 'data' })
   * // const pet = await getPetById({ path: { petId: 1 } }) // Pet, not { status, data, ... }
   * ```
   */
  returnType?: ReturnTypeOption
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
   * @example Composed root that shares one client with every tag client
   * ```ts
   * pluginFetch({ sdk: { name: 'petStore' } })
   * // class PetStore {
   * //   readonly client: ClientInstance
   * //   readonly pet: PetClient
   * //   readonly store: StoreClient
   * //   constructor(config = {}) { ... }
   * // }
   * // const api = new PetStore({ baseURL })
   * // api.client.interceptors.request.use(...) // applies to every tag
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
     * - `'tag'`: one class per tag, such as `PetClient`. With `name`, a composed root shares one client with every tag client.
     * - `'flat'`: one class named by `name`, with every operation as a direct method.
     *
     * @default 'tag'
     */
    mode?: Mode
    /**
     * Name of the generated entry point, also the file name. With `mode: 'tag'` it emits a
     * composed root class that creates one client and shares it with every tag client. With
     * `mode: 'flat'` it names the single class.
     */
    name?: string
  }
  /**
   * Override how names and file paths are built. Methods you omit fall back to the default resolver.
   */
  resolver?: ResolverInput<ResolverClient>
  /**
   * Macros applied to each operation node before code is printed.
   */
  macros?: Array<ast.Macro>
}

/**
 * The resolved options after defaults are applied.
 */
export type ClientResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<Omit<ClientResolvedOptions, 'throwOnErrorDefault'>>>
  group: Group | null
  baseURL: ClientOptions['baseURL']
  /**
   * Module the generated operations import the client runtime from, used verbatim. Unset, they import the bundled `.kubb/client.ts`.
   */
  importPath?: string
  throwOnErrorDefault: boolean
  validator: NonNullable<ClientOptions['validator']>
  auth: { mode: AuthMode }
  returnType: ReturnTypeOption
  sdk:
    | {
        mode: Mode
        name: string | undefined
      }
    | undefined
  resolver: ResolverClient
}

/**
 * The plugin type behind the shared resolver. Each concrete plugin (plugin-fetch, plugin-axios)
 * declares its own name and registers itself; this base ties the shared builders, resolver, and
 * components to one option/resolver shape.
 */
export type PluginContractClient = PluginType<'plugin-contract-client', ClientOptions, ClientResolvedOptions, ResolverClient>

/**
 * The shape any client plugin (plugin-fetch, plugin-axios) must satisfy to reuse the shared
 * client and SDK generators. Pins the option, resolved-option, and resolver shapes while leaving
 * the plugin name free.
 */
export type ContractClientFactory = PluginType<string, ClientOptions, ClientResolvedOptions, ResolverClient>
