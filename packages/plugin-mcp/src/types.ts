import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

/**
 * Resolver for MCP that provides naming methods for handler functions.
 */
export type ResolverMcp = Resolver & {
  /**
   * Resolves the base handler function name for an operation.
   *
   * @example Resolving handler function names
   * `resolver.resolveName('show pet by id') // -> 'showPetByIdHandler'`
   */
  resolveName(this: ResolverMcp, name: string): string
  /**
   * Resolves the output file name for an MCP module.
   */
  resolvePathName(this: ResolverMcp, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves the handler function name for an operation.
   */
  resolveHandlerName(this: ResolverMcp, node: ast.OperationNode): string
}

export type Options = {
  /**
   * Where the generated MCP tool handlers are written and how they are exported.
   *
   * @default { path: 'mcp', barrel: { type: 'named' } }
   */
  output?: Output
  /**
   * HTTP client used by each MCP handler to call the underlying API. Mirrors a
   * subset of `pluginClient` options.
   */
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'>
  /**
   * Rename parameter properties in the generated handlers. The HTTP layer still
   * uses the original spec names; Kubb writes the mapping for you.
   *
   * @note Must match the value of `paramsCasing` on `@kubb/plugin-ts`.
   */
  paramsCasing?: 'camelcase'
  /**
   * Split generated files into subfolders based on the operation's tag.
   */
  group?: Group
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
   * Override how handler names and file paths are built. Methods you omit fall
   * back to the default `resolverMcp`.
   */
  resolver?: Partial<ResolverMcp> & ThisType<ResolverMcp>
  /**
   * AST visitor applied to each operation node before printing.
   */
  transformer?: ast.Visitor
  /**
   * Custom generators that run alongside the built-in MCP generators.
   */
  generators?: Array<Generator<PluginMcp>>
}

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
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
