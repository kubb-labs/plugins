import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

/**
 * HTTP client each MCP handler uses to call the underlying API. When no client plugin
 * (`@kubb/plugin-axios` or `@kubb/plugin-fetch`) is registered, the runtime named here is bundled
 * into `.kubb/client.ts`. Set `importPath` to import a custom client module instead.
 */
export type McpClient = {
  /**
   * HTTP client runtime bundled into `.kubb/client.ts` when no client plugin is registered.
   *
   * @default 'axios'
   */
  client?: 'axios' | 'fetch'
  /**
   * Path to a custom client module. When set, handlers import their client from here and nothing
   * is bundled.
   */
  importPath?: string
  /**
   * Base URL prepended to every request.
   */
  baseURL?: string
}

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
   * HTTP client used by each MCP handler to call the underlying API.
   */
  client?: McpClient
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
}

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  client: McpClient
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
