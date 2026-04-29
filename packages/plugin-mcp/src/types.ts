import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

/**
 * Resolver for MCP that provides naming methods for handler functions.
 */
export type ResolverMcp = Resolver & {
  /**
   * Resolves the handler function name for an operation.
   *
   * @example
   * `resolver.resolveName('show pet by id') // -> 'showPetByIdHandler'`
   */
  resolveName(this: ResolverMcp, name: string): string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output.
   * @default { path: 'mcp', barrelType: 'named' }
   */
  output?: Output
  /**
   * Client configuration for HTTP request generation.
   */
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'>
  /**
   * Apply casing to parameter names to match your configuration.
   */
  paramsCasing?: 'camelcase'
  /**
   * Group the MCP requests based on the provided name.
   */
  group?: Group
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
   * Override naming conventions for function names and types.
   */
  resolver?: Partial<ResolverMcp> & ThisType<ResolverMcp>
  /**
   * AST visitor to transform generated nodes.
   */
  transformer?: ast.Visitor
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginMcp>>
}

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | undefined
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'bundle' | 'paramsCasing'>
  paramsCasing: Options['paramsCasing']
  resolver: ResolverMcp
}

export type PluginMcp = PluginFactoryOptions<'plugin-mcp', Options, ResolvedOptions, ResolverMcp>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-mcp': PluginMcp
    }
  }
}
