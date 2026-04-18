import type {
  ast,
  Exclude,
  Generator,
  Group,
  Include,
  Output,
  Override,
  PluginFactoryOptions,
  ResolveNameParams,
  Resolver,
  UserGroup,
} from '@kubb/core'

export type ResolverMsw = Resolver & {
  resolveName(this: ResolverMsw, name: string): string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'handlers', barrelType: 'named' }
   */
  output?: Output
  baseURL?: string
  /**
   * Group the MSW mocks based on the provided name.
   */
  group?: UserGroup
  /**
   * Array containing exclude parameters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include parameters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override parameters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Override individual resolver methods.
   */
  resolver?: Partial<ResolverMsw> & ThisType<ResolverMsw>
  /**
   * Single AST visitor applied before printing.
   */
  transformer?: ast.Visitor
  /**
   * Create `handlers.ts` file with all handlers grouped by methods.
   * @default false
   */
  handlers?: boolean
  /**
   * Which parser should be used before returning the data to the Response of MSW.
   * - 'data' uses your custom data to generate the data for the response.
   * - 'faker' uses @kubb/plugin-faker to generate the data for the response.
   * @default 'data'
   */
  parser?: 'data' | 'faker'
  /**
   * Define some generators next to the msw generators
   */
  generators?: Array<Generator<PluginMsw>>
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  parser: NonNullable<Options['parser']>
  baseURL: Options['baseURL'] | undefined
  handlers: boolean
  transformers: NonNullable<Options['transformers']>
  resolver: ResolverMsw
}

export type PluginMsw = PluginFactoryOptions<'plugin-msw', Options, ResolvedOptions, never, object, ResolverMsw>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-msw': PluginMsw
    }
  }
}
