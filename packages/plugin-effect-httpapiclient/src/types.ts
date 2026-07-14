import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver, ResolverPatch } from 'kubb/kit'

/**
 * Resolver for generated Effect HttpApi identifiers and files.
 */
export type ResolverEffectHttpApiClient = Resolver & {
  /**
   * Naming rules for operation endpoints.
   */
  endpoint: {
    /**
     * Resolves the exported endpoint constant name.
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the identifier exposed by the generated client.
     */
    identifier(node: ast.OperationNode): string
  }
  /**
   * Naming rules for HttpApi groups.
   */
  group: {
    /**
     * Resolves the exported group constant name.
     */
    name(tag: string): string
    /**
     * Resolves the property name exposed by a grouped client.
     */
    identifier(tag: string): string
  }
  /**
   * Naming rules for the root HttpApi contract.
   */
  api: {
    /**
     * Resolves the exported HttpApi constant name.
     */
    name(): string
  }
  /**
   * Naming rules for the fixed HttpApiClient Effect.
   */
  client: {
    /**
     * Resolves the exported client type and value name.
     */
    name(): string
  }
}

/**
 * Options for generating Effect v4 HttpApi contracts and clients.
 */
export type Options = OutputOptions & {
  /**
   * Base URL embedded in the generated `HttpApiClient.make` call.
   */
  baseURL?: string
  /**
   * Controls whether client methods are grouped by the first OpenAPI tag or exposed at the root.
   *
   * @default 'tag'
   */
  mode?: 'tag' | 'flat'
  /**
   * Skips operations matching at least one entry.
   */
  exclude?: Array<Exclude>
  /**
   * Restricts generation to matching operations.
   */
  include?: Array<Include>
  /**
   * Applies different options to matching operations.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Overrides generated endpoint, group, API, client, and file names.
   */
  resolver?: ResolverPatch<ResolverEffectHttpApiClient>
  /**
   * Macros applied before printing each operation.
   */
  macros?: Array<ast.Macro>
}

/**
 * Fully resolved options supplied to the Effect HttpApiClient generator.
 */
export type ResolvedOptions = {
  /**
   * Resolved output target.
   */
  output: Output
  /**
   * Resolved operation exclusions.
   */
  exclude: Array<Exclude>
  /**
   * Resolved operation inclusions.
   */
  include: Array<Include> | undefined
  /**
   * Resolved per-operation overrides.
   */
  override: Array<Override<ResolvedOptions>>
  /**
   * Resolved output grouping.
   */
  group: Group | null
  /**
   * Base URL embedded in the generated client.
   */
  baseURL: string | undefined
  /**
   * Generated client grouping mode.
   */
  mode: NonNullable<Options['mode']>
}

/**
 * Kubb registry entry for `@kubb/plugin-effect-httpapiclient`.
 */
export type PluginEffectHttpApiClient = PluginFactoryOptions<'plugin-effect-httpapiclient', Options, ResolvedOptions, ResolverEffectHttpApiClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-effect-httpapiclient': PluginEffectHttpApiClient
    }
  }
}
