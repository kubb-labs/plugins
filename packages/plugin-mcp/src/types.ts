import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
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

/**
 * Where the generated MCP tool handlers are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'mcp', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * HTTP client used by each MCP handler to call the underlying API. Mirrors a
   * subset of `pluginClient` options.
   */
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'paramsCasing'>
  /**
   * Rename parameter properties in the generated handlers. The HTTP layer still
   * uses the original spec names; Kubb writes the mapping for you.
   *
   * @note Must match the value of `paramsCasing` on `@kubb/plugin-ts`.
   */
  paramsCasing?: 'camelcase'
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
   * Macros applied to each operation node before printing.
   */
  macros?: Array<ast.Macro>
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
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'paramsCasing'>
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
