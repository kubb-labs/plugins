import type { ast } from '@internals/ast'
import { Diagnostics, operationKey, type TemplateContext, text, useKubb } from '@kubb/kit'
import { pluginTsName, type ResolverTs } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'

// A type-only import: the query plugins bundle this file but do not depend on @kubb/plugin-zod.
const pluginZodName = 'plugin-zod' satisfies PluginZod['name']

/**
 * The per-operation type names a generated client references: the grouped input, the per-status
 * responses record its `RequestResult` is keyed on, and the headers each response declares.
 */
export type OperationTypeNames = {
  response: {
    /**
     * Resolves the name of the operation's grouped `{ body, path, query, headers, cookies }` input type.
     */
    options(node: ast.OperationNode): string
    /**
     * Resolves the name of the operation's per-status responses record type.
     */
    responses(node: ast.OperationNode): string
    /**
     * Resolves the name of the type of the headers one response declares. Left out, results keep untyped headers.
     */
    headers?(node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the name a generated file declares the operation's per-status headers map under, such as
     * `LoginUserResponseHeaders`. Left out, the map is written inline wherever it is used.
     */
    headersMap?(node: ast.OperationNode): string
  }
}

function getResponseHeadersEntries({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<[ast.StatusCode, string]> {
  const resolve = types.response.headers
  if (!resolve) return []
  return node.responses
    .filter((response) => response.headers?.length)
    .map((response) => [response.statusCode, resolve.call(types.response, node, response.statusCode)])
}

/**
 * The headers type argument of `RequestResult`, such as `{ '200': LoginUserStatus200Headers }`, or `null` when no response declares headers.
 */
export function buildResponseHeadersType({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string | null {
  const entries = getResponseHeadersEntries({ node, types }).map(([statusCode, name]) => `${text.quote(statusCode)}: ${name}`)
  return entries.length ? `{ ${entries.join('; ')} }` : null
}

/**
 * The per-status headers map a generated file declares once, under its `headersMap` name, so the return type and the
 * client call share one type and TypeScript does not compare two copies of the same `RequestResult` for every operation.
 * `null` when no response declares headers or the resolver has no `headersMap`.
 */
export function buildResponseHeadersDeclaration({
  node,
  types,
}: {
  node: ast.OperationNode
  types: OperationTypeNames
}): { name: string; type: string } | null {
  const type = buildResponseHeadersType({ node, types })
  const name = type ? types.response.headersMap?.(node) : undefined
  return type && name ? { name, type } : null
}

/**
 * How a generated signature refers to the per-status headers map: by its declared name, otherwise as the map itself.
 * `null` when no response declares headers.
 */
export function buildResponseHeadersRef({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string | null {
  return buildResponseHeadersDeclaration({ node, types })?.name ?? buildResponseHeadersType({ node, types })
}

/**
 * A runtime result type, such as `RequestResult`, in its `WithHeaders` form when `headers` is set.
 */
export function resultTypeName(name: string, headers: boolean): string {
  return headers ? `${name}WithHeaders` : name
}

/**
 * A runtime result type with its arguments, such as `RequestResultWithHeaders<Responses, Headers, ThrowOnError>`.
 */
export function buildResultTypeRef(name: string, responses: string, headers: string | null, rest: Array<string | null> = []): string {
  return `${resultTypeName(name, headers !== null)}<${[responses, headers, ...rest].filter(Boolean).join(', ')}>`
}

/**
 * The names of the headers types `buildResponseHeadersType` references, for the file's imports.
 */
export function getResponseHeadersTypeNames({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<string> {
  return getResponseHeadersEntries({ node, types }).map(([, name]) => name)
}

/**
 * Where a generated client sources its operation types, plus the resolver of the plugin that provides them.
 */
export type OperationTypeSource = OperationTypeNames & {
  /**
   * `plugin-ts` shaped resolver of the plugin that provides `types`.
   */
  resolver: ResolverTs
}

/**
 * Picks the plugin generated clients, query hooks, and MCP handlers take their operation types from.
 *
 * `pluginZod({ inferred: 'codec' })` wins, so a codec param takes its domain value. Otherwise `plugin-ts`
 * wins when it is in the pipeline, and without it any `pluginZod({ inferred })`. Throws
 * `KUBB_MISSING_DEPENDENCY` for the current plugin when neither is available. Reads the current generator context.
 *
 * @example
 * ```ts
 * const types = resolveOperationTypes()
 * types.response.options(node) // 'GetPetByIdOptions', or 'GetPetByIdOptionsSchemaType' from zod
 * ```
 */
export function resolveOperationTypes(): OperationTypeSource {
  const ctx = useKubb<TemplateContext>()
  const pluginName = ctx.plugin.name
  return ctx.memo(`operationTypes:${pluginName}`, () => {
    if (!ctx.getPlugin(pluginTsName) && !ctx.getPlugin(pluginZodName)?.options?.inferred) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.missingDependency,
        severity: 'error',
        message: `Plugin "${pluginName}" has no source for operation types.`,
        help: `Add \`pluginTs()\` before "${pluginName}", or add \`pluginZod({ inferred: true })\`.`,
        location: { kind: 'config' },
        plugin: pluginName,
      })
    }

    // plugin-ts and `pluginZod({ inferred })` provide `types`, and kit picks the provider by priority.
    const resolver = ctx.getResolver('types')
    // Resolved through the types resolver, so the local name never clashes with a schema or another operation type.
    const headersMap = (node: ast.OperationNode) =>
      resolver.resolveName({ key: operationKey(node, 'response', 'headersMap'), name: resolver.name(`${node.operationId} Response Headers`) })
    return { response: { ...resolver.response, headersMap }, resolver }
  })
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      operationTypes: OperationTypeSource
    }
  }
}
