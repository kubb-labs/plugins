import type { Transformer } from '@internals/tanstack-query'
import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

export type { Transformer } from '@internals/tanstack-query'

/**
 * Resolver for React Query that provides naming methods for hook functions.
 */
export type ResolverReactQuery = Resolver & {
  /**
   * Resolves the hook function name for an operation.
   *
   * @example Resolving hook names
   * `resolver.resolveName('show pet by id') // -> 'showPetById'`
   */
  resolveName(this: ResolverReactQuery, name: string): string
}

type Suspense = object

/**
 * Customize the queryKey.
 */
type QueryKey = Transformer

/**
 * Customize the mutationKey.
 */
type MutationKey = Transformer

type Query = {
  /**
   * HTTP methods to use for queries.
   *
   * @default ['get']
   */
  methods?: Array<string>
  /**
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

type Mutation = {
  /**
   * HTTP methods to use for mutations.
   *
   * @default ['post', 'put', 'delete']
   */
  methods?: Array<string>
  /**
   * Path to the useMutation hook for useMutation functionality.
   * Used as `import { useMutation } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

export type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * @default 'id'
   */
  queryParam: string
  /**
   * Which field of the data is used, set it to undefined when no cursor is known.
   * @deprecated Use `nextParam` and `previousParam` instead for more flexible pagination handling.
   */
  cursorParam?: string | undefined
  /**
   * Which field of the data is used to get the cursor for the next page.
   * Supports dot notation (e.g. 'pagination.next.id') or array path (e.g. ['pagination', 'next', 'id']) to access nested fields.
   */
  nextParam?: string | string[] | undefined
  /**
   * Which field of the data is used to get the cursor for the previous page.
   * Supports dot notation (e.g. 'pagination.prev.id') or array path (e.g. ['pagination', 'prev', 'id']) to access nested fields.
   */
  previousParam?: string | string[] | undefined
  /**
   * The initial value, the value of the first page.
   * @default 0
   */
  initialPageParam: unknown
}

type CustomOptions = {
  /**
   * Path to the hook that is used to customize the hook options.
   * It used as `import ${customOptions.name} from '${customOptions.importPath}'`.
   * It allows both relative and absolute paths but be aware that we will not change the path.
   */
  importPath: string
  /**
   * Name of the exported hook that is used to customize the hook options.
   * It used as `import ${customOptions.name} from '${customOptions.importPath}'`.
   * @default 'useCustomHookOptions'
   */
  name?: string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'hooks', barrelType: 'named' }
   */
  output?: Output
  /**
   * Group the @tanstack/query hooks based on the provided name.
   */
  group?: Group
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'>
  /**
   * Tags, operations, or paths to exclude from generation.
   */
  exclude?: Array<Exclude>
  /**
   * Tags, operations, or paths to include in generation.
   */
  include?: Array<Include>
  /**
   * Override options for specific tags, operations, or paths.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Apply casing to parameter names.
   */
  paramsCasing?: 'camelcase'
  /**
   * How parameters are passed: grouped in an object or spread inline.
   *
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline'
  /**
   * How path parameters are passed: grouped in an object or spread inline.
   *
   * @default 'inline'
   */
  pathParamsType?: PluginClient['options']['pathParamsType']
  /**
   * When `true`, widens path parameter signatures to `T | (() => T) | undefined`,
   * letting callers pass a zero-arg getter alongside the value form. Inside the
   * hook body, each path param is unwrapped once via
   * `typeof v === 'function' ? v() : v` before it is forwarded to
   * `queryKey(...)` and `queryOptions(...)`.
   *
   * Useful for reactive frameworks where reading a path param value at
   * hook-call time captures only the initial value (Svelte 5 `$state`,
   * Solid signals, MobX observables, etc.). Wrapping the read in a getter
   * lets the closure re-evaluate on each access.
   *
   * Runtime cost: a single `typeof` check per generated hook call.
   * Defaults to `false` — non-breaking, opt-in.
   *
   * @default false
   */
  pathParamsAsGetters?: boolean
  /**
   * Add infinite query hooks.
   */
  infinite?: Partial<Infinite> | false
  /**
   * Add suspense query hooks.
   */
  suspense?: Partial<Suspense> | false
  queryKey?: QueryKey
  /**
   * Configure useQuery behavior.
   */
  query?: Partial<Query> | false
  mutationKey?: MutationKey
  /**
   * Configure useMutation behavior.
   */
  mutation?: Partial<Mutation> | false
  /**
   * Use a custom hook to customize hook options and generate a HookOptions type.
   */
  customOptions?: CustomOptions
  /**
   * Parser to use for validating response data.
   */
  parser?: PluginClient['options']['parser']
  transformers?: {
    /**
     * Override the default naming for hooks.
     */
    name?: (name: string, type?: string) => string
  }
  /**
   * Override naming conventions for function names and types.
   */
  resolver?: Partial<ResolverReactQuery> & ThisType<ResolverReactQuery>
  /**
   * AST visitor to transform generated nodes.
   */
  transformer?: ast.Visitor
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginReactQuery>>
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'bundle' | 'paramsCasing'>
  parser: Required<NonNullable<Options['parser']>>
  pathParamsType: NonNullable<Options['pathParamsType']>
  pathParamsAsGetters: boolean
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
  /**
   * Only used for infinite
   */
  infinite: NonNullable<Infinite> | false
  suspense: Suspense | false
  queryKey: QueryKey | undefined
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | undefined
  mutation: NonNullable<Required<Mutation>> | false
  customOptions: NonNullable<Required<CustomOptions>> | undefined
  resolver: ResolverReactQuery
  transformers: NonNullable<Options['transformers']>
}

export type PluginReactQuery = PluginFactoryOptions<'plugin-react-query', Options, ResolvedOptions, ResolverReactQuery>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-react-query': PluginReactQuery
    }
  }
}
