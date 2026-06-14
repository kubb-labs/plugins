import { getOperationParameters } from '@internals/shared'
import { ast } from '@kubb/core'
import type { PluginTs, ResolverTs } from '@kubb/plugin-ts'
import type { ParamsCasing, ParamsType, PathParamsType } from './types.ts'

/**
 * Returns the `TypeLiteral` members of a destructured group parameter, or `null`
 * for a plain named parameter.
 */
function groupMembers(param: ast.FunctionParameterNode): ReadonlyArray<{ name: string; type: ast.TypeExpression; optional?: boolean }> | null {
  if (typeof param.name === 'string') return null
  return param.type && typeof param.type !== 'string' && param.type.kind === 'TypeLiteral' ? param.type.members : []
}

/**
 * Builds the shared `(…params, config = {})` parameter list for a TanStack
 * query-options function. The trailing `config` parameter is typed as a partial
 * `RequestConfig` with an optional `client`. Framework plugins wrap the result
 * when needed, for example vue-query applies `MaybeRefOrGetter`.
 */
export function buildQueryOptionsParams(
  node: ast.OperationNode,
  options: { paramsType: ParamsType; paramsCasing: ParamsCasing; pathParamsType: PathParamsType; resolver: ResolverTs },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, resolver } = options
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined

  return ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver,
    extraParams: [
      ast.createFunctionParameter({
        name: 'config',
        type: requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }',
        default: '{}',
      }),
    ],
  })
}

export function transformName(name: string, type: string, transformers?: { name?: (name: string, type?: string) => string }): string {
  return transformers?.name?.(name, type) || name
}

type OverrideEntry<TOptions> = {
  type: string
  pattern: string | RegExp
  options?: Partial<TOptions>
}

function matchesPattern(node: ast.OperationNode, ov: { type: string; pattern: string | RegExp }): boolean {
  const { type, pattern } = ov
  const matches = (value: string) => (typeof pattern === 'string' ? value === pattern : pattern.test(value))
  if (type === 'operationId') return matches(node.operationId)
  if (type === 'tag') return node.tags.some((t) => matches(t))
  if (type === 'path') return node.path !== undefined && matches(node.path)
  if (type === 'method') return node.method !== undefined && matches(node.method)
  return false
}

/**
 * Resolves per-operation overrides (first matching override wins).
 *
 * @example
 * ```ts
 * const opts = resolveOperationOverrides(node, override)
 * const queryOpts = 'query' in opts ? opts.query : defaultQuery
 * ```
 */
export function resolveOperationOverrides<TOptions>(node: ast.OperationNode, override?: ReadonlyArray<OverrideEntry<TOptions>>): Partial<TOptions> {
  if (!override) return {}
  const match = override.find((ov) => matchesPattern(node, ov))
  return match?.options ?? {}
}

type ZodSchemaNameResolverLike = {
  resolveResponseName?: (node: ast.OperationNode) => string | undefined
  resolveDataName?: (node: ast.OperationNode) => string | undefined
  resolveQueryParamsName?: (node: ast.OperationNode, param: ast.ParameterNode) => string | undefined
}

type ParserOption = false | 'zod' | { request?: 'zod'; response?: 'zod' } | undefined

/**
 * Returns `'zod'` when response-direction parsing is enabled.
 * The string shorthand `'zod'` also enables response parsing.
 */
export function resolveResponseParser(parser: ParserOption): 'zod' | null {
  if (!parser) return null
  if (parser === 'zod') return 'zod'
  return parser.response ?? null
}

/**
 * Returns `'zod'` when request body parsing is enabled.
 * The string shorthand `'zod'` also enables request body parsing (existing behavior).
 */
export function resolveRequestParser(parser: ParserOption): 'zod' | null {
  if (!parser) return null
  if (parser === 'zod') return 'zod'
  return parser.request ?? null
}

/**
 * Returns `'zod'` when query-params parsing is enabled.
 * Only the object form `{ request: 'zod' }` enables this. `parser: 'zod'` does not.
 */
export function resolveQueryParamsParser(parser: ParserOption): 'zod' | null {
  if (!parser || parser === 'zod') return null
  return parser.request ?? null
}

/**
 * Collects the Zod schema import names for an operation based on the active parser directions.
 *
 * - `parser: 'zod'`: response and request body names (backward-compatible behavior).
 * - `parser: { request: 'zod' }`: request body and query params names.
 * - `parser: { response: 'zod' }`: response name only.
 * - `parser: { request: 'zod', response: 'zod' }`: all three.
 *
 * Returns an empty array when no resolver is provided or `parser` is falsy.
 */
export function resolveZodSchemaNames(node: ast.OperationNode, zodResolver: ZodSchemaNameResolverLike | null | undefined, parser: ParserOption): string[] {
  if (!zodResolver || !parser) return []
  const { query: queryParams } = getOperationParameters(node)
  return [
    resolveResponseParser(parser) === 'zod' ? zodResolver.resolveResponseName?.(node) : null,
    resolveRequestParser(parser) === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null,
    resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, queryParams[0]!) : null,
  ].filter((n): n is string => Boolean(n))
}

/**
 * Build QueryKey params: pathParams + data + queryParams (NO headers, NO config).
 */
export function buildQueryKeyParams(
  node: ast.OperationNode,
  options: {
    pathParamsType: 'object' | 'inline'
    paramsCasing: 'camelcase' | undefined
    resolver: PluginTs['resolver']
  },
): ast.FunctionParametersNode {
  const { pathParamsType, paramsCasing, resolver } = options

  const casedParams = ast.caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')

  const queryGroupType = ast.resolveGroupType({ node, params: queryParams, group: 'query', resolver })

  const bodyType = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : null
  const bodyRequired = node.requestBody?.required ?? false

  const params: Array<ast.FunctionParameterNode> = []

  // Path params
  if (pathParams.length) {
    const pathChildren = pathParams.map((p) => ({ name: p.name, type: ast.resolveParamType({ node, param: p, resolver }), optional: !p.required }))
    if (pathParamsType === 'object') {
      params.push(ast.createFunctionParameter({ properties: pathChildren, default: pathChildren.every((c) => c.optional) ? '{}' : undefined }))
    } else {
      params.push(...pathChildren.map((child) => ast.createFunctionParameter(child)))
    }
  }

  // Request body
  if (bodyType) {
    params.push(ast.createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired }))
  }

  // Query params
  params.push(...ast.buildGroupParam({ name: 'params', node, params: queryParams, groupType: queryGroupType, resolver, wrapType: (type) => type }))

  return ast.createFunctionParameters({ params })
}

/**
 * Collect the names of the required params (no default) that drive the `enabled`
 * guard. These are exactly the params that should be made optional in the
 * generated signatures so callers can pass `undefined` to reach the disabled state.
 */
export function getEnabledParamNames(paramsNode: ast.FunctionParametersNode): string[] {
  const required: string[] = []
  for (const param of paramsNode.params) {
    const members = groupMembers(param)
    if (members) {
      for (const member of members) {
        if (!member.optional) required.push(member.name)
      }
    } else if (typeof param.name === 'string' && !param.optional && param.default === undefined) {
      required.push(param.name)
    }
  }
  return required
}

/**
 * Return a copy of `paramsNode` with the named params marked optional.
 *
 * Used to align signatures with the `enabled` guard: the guard already disables
 * the query while a param is falsy, so the param should accept `undefined`. The
 * change is type-only — the `queryFn` keeps calling the client with a non-null
 * assertion (see `injectNonNullAssertions`), so the emitted runtime is unchanged.
 */
export function markParamsOptional(paramsNode: ast.FunctionParametersNode, names: ReadonlyArray<string>): ast.FunctionParametersNode {
  if (names.length === 0) return paramsNode
  const nameSet = new Set(names)
  const params = paramsNode.params.map((param) => {
    const members = groupMembers(param)
    if (members) {
      const next = members.map((member) => (nameSet.has(member.name) ? { ...member, optional: true } : member))
      return { ...param, type: ast.createTypeLiteral({ members: next }) }
    }
    return typeof param.name === 'string' && nameSet.has(param.name)
      ? ast.createFunctionParameter({ name: param.name, type: param.type, rest: param.rest, optional: true })
      : param
  })
  return ast.createFunctionParameters({ params })
}

/**
 * Add a non-null assertion (`!`) to the named params inside a printed client-call
 * string. Bridges the type gap created by `markParamsOptional` while keeping the
 * runtime identical (the `!` is erased at compile time).
 *
 * Handles destructured shorthand groups (`{ petId }` → `{ petId: petId! }`) and
 * standalone identifiers (`params` → `params!`).
 */
export function injectNonNullAssertions(callStr: string, names: ReadonlyArray<string>): string {
  if (names.length === 0) return callStr
  const nameSet = new Set(names)

  // Step 1: destructured shorthand group `{ petId }` → `{ petId: petId! }`
  let result = callStr.replace(/\{\s*([\w,\s]+)\s*\}(?=\s*,)/g, (match, inner: string) => {
    if (inner.includes(':') || inner.includes('...')) return match
    const keys = inner
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean)
    if (!keys.some((k) => nameSet.has(k))) return match
    const rebuilt = keys.map((k) => (nameSet.has(k) ? `${k}: ${k}!` : k)).join(', ')
    return `{ ${rebuilt} }`
  })

  // Step 2: standalone identifiers like `params`, `data`
  result = result.replace(/(?<![{.:?])\b(\w+)\b(?=\s*,)/g, (match, name: string) => (nameSet.has(name) ? `${name}!` : match))

  return result
}
