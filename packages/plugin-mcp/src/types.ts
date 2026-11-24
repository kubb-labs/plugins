import type { ast } from '@internals/ast'
import type { ClientSelector, ResolvedContractClient } from '@internals/client'
import type { PluginOptions, ResolvedPluginOptions } from '@internals/shared/types'
import type { PluginType, Resolver, ResolverInput } from '@kubb/kit'

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
export type Options = PluginOptions<ResolvedOptions> & {
  /**
   * Selects the HTTP client each MCP handler calls. Every client plugin speaks the `RequestResult`
   * contract, so each handler calls a contract `<op>` that takes one grouped `{ path, query, headers,
   * body }` object.
   *
   * `'fetch'` / `'axios'` / `'ky'` / `'client'` calls the `@kubb/plugin-fetch` / `@kubb/plugin-axios` / `@kubb/plugin-ky` /
   * `@kubb/plugin-client` functions. When a single client plugin is registered it is auto-detected, so the
   * string is only needed to disambiguate several client plugins. Register one of those plugins.
   * Options such as `baseURL` live there, or in your own module with `@kubb/plugin-client`.
   */
  client?: ClientSelector
  /**
   * Override how handler names and file paths are built. Methods you omit fall
   * back to the default `resolverMcp`.
   */
  resolver?: ResolverInput<ResolverMcp>
  /**
   * Macros applied to each operation node before printing.
   */
  macros?: Array<ast.Macro>
}

export type ResolvedOptions = ResolvedPluginOptions<ResolvedOptions> & {
  /**
   * The resolved client strategy the generators branch on.
   */
  client: ResolvedContractClient
  resolver: ResolverMcp
}

export type PluginMcp = PluginType<'plugin-mcp', Options, ResolvedOptions, ResolverMcp>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-mcp': PluginMcp
    }
    interface MemoRegistry {
      'plugin-mcp:toolName': string
      'plugin-mcp:toolNames': Set<string>
    }
  }
}
