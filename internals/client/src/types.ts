import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

/**
 * Validator applied to request and response bodies using schemas from `@kubb/plugin-zod`.
 * - `false`: no validation.
 * - `'zod'`: validates success (2xx) response bodies only.
 * - `{ request?: 'zod'; response?: 'zod' }`: opt in per direction. `request` validates the request
 *   body and query parameters before the call; `response` validates the success response body.
 */
export type ParserOptions = false | 'zod' | { request?: 'zod'; response?: 'zod' }

/**
 * The resolver shared by the slim client plugins. Functions and files use camelCase; URL helpers get
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
   * Resolves the URL helper function name for an operation.
   *
   * @example
   * `resolver.resolveUrlName(node) // -> 'getShowPetByIdUrl'`
   */
  resolveUrlName(this: ResolverClient, node: ast.OperationNode): string
}

/**
 * The slim, shared options surface for the client plugins. Deliberately small: there is one
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
   * Override how names and file paths are built. Methods you omit fall back to the default resolver.
   */
  resolver?: Partial<ResolverClient> & ThisType<ResolverClient>
  /**
   * Macros applied to each operation node before code is printed.
   */
  macros?: Array<ast.Macro>
  /**
   * Custom generators that run alongside the built-in client generator.
   */
  generators?: Array<Generator<PluginSlimClient>>
}

/**
 * The resolved slim options after defaults are applied.
 */
export type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  baseURL: Options['baseURL']
  parser: NonNullable<Options['parser']>
  resolver: ResolverClient
}

/**
 * The plugin factory type shared by the slim client plugins. Each concrete plugin (plugin-fetch,
 * plugin-axios, plugin-ky) declares its own name and registers itself; this base ties the shared
 * builders, resolver, and components to one option/resolver shape.
 */
export type PluginSlimClient = PluginFactoryOptions<'plugin-slim-client', Options, ResolvedOptions, ResolverClient>
