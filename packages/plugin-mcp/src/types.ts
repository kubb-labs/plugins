import type { ClientSelector } from '@internals/client'
import type { ast, ResolverPatch, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'

/**
 * Resolver for MCP that provides naming methods for handler functions.
 */
export type ResolverMcp = Resolver & {
  /**
   * Naming for the generated MCP tool handler functions.
   */
  handler: {
    /**
     * Resolves the handler function name for an operation.
     *
     * @example Resolving handler function names
     * `resolver.handler.name(operationNode) // -> 'showPetByIdHandler'`
     */
    name(node: ast.OperationNode): string
  }
}

/**
 * Where the generated MCP tool handlers are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'mcp', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Selects the HTTP client each MCP handler calls. Every client plugin speaks the `RequestResult`
   * contract, so each handler calls a contract `<op>` that takes one grouped `{ path, query, headers,
   * body }` object.
   *
   * `'fetch'` / `'axios'` calls the `@kubb/plugin-fetch` / `@kubb/plugin-axios` functions. When a
   * single client plugin (plugin-fetch or plugin-axios) is registered it is auto-detected, so the
   * string is only needed to disambiguate several client plugins. Register one of those plugins.
   * Options such as `baseURL` live there.
   */
  client?: ClientSelector
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
  resolver?: ResolverPatch<ResolverMcp> | ResolverMcp
  /**
   * Macros applied to each operation node before printing.
   */
  macros?: Array<ast.Macro>
}

/**
 * The resolved client strategy for the generated handlers, computed once during setup. The handlers
 * always import and call a registered contract client plugin's `<op>`.
 */
export type ResolvedClient = { kind: 'contract'; pluginName: string }

export type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  /**
   * The resolved client strategy the generators branch on.
   */
  client: ResolvedClient
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
