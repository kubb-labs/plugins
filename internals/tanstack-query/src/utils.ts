import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'

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
  if (type === 'path') return matches(node.path)
  if (type === 'method') return matches(node.method)
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
}

/**
 * Collects the Zod schema import names for an operation (response + request body).
 *
 * Returns an empty array when no resolver is provided or the operation has no request body schema.
 */
export function resolveZodSchemaNames(node: ast.OperationNode, zodResolver: ZodSchemaNameResolverLike | undefined): string[] {
  if (!zodResolver) return []
  return [zodResolver.resolveResponseName?.(node), node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : undefined].filter(
    (n): n is string => Boolean(n),
  )
}

/**
 * Resolve the type for a single path parameter.
 *
 * - When the resolver's group name differs from the individual param name
 *   (e.g. kubbV4) → `GroupName['paramName']` (member access).
 * - When they match (v5 default) → `TypeName` (direct reference).
 */
export function resolvePathParamType(node: ast.OperationNode, param: ast.ParameterNode, resolver: PluginTs['resolver']): ast.ParamsTypeNode {
  const individualName = resolver.resolveParamName(node, param)
  const groupName = resolver.resolvePathParamsName(node, param)

  if (groupName !== individualName) {
    return ast.createParamsType({ variant: 'member', base: groupName, key: param.name })
  }
  return ast.createParamsType({ variant: 'reference', name: individualName })
}

type QueryGroupResult = { type: ast.ParamsTypeNode; optional: boolean } | undefined

/**
 * Derive a query-params group type from the resolver.
 * Returns `undefined` when no query params exist or when the group name
 * equals the individual param name (no real group).
 */
export function resolveQueryGroupType(node: ast.OperationNode, params: ast.ParameterNode[], resolver: PluginTs['resolver']): QueryGroupResult {
  if (!params.length) return undefined
  const firstParam = params[0]!
  const groupName = resolver.resolveQueryParamsName(node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) return undefined
  return { type: ast.createParamsType({ variant: 'reference', name: groupName }), optional: params.every((p) => !p.required) }
}

/**
 * Derive a header-params group type from the resolver.
 */
export function resolveHeaderGroupType(node: ast.OperationNode, params: ast.ParameterNode[], resolver: PluginTs['resolver']): QueryGroupResult {
  if (!params.length) return undefined
  const firstParam = params[0]!
  const groupName = resolver.resolveHeaderParamsName(node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) return undefined
  return { type: ast.createParamsType({ variant: 'reference', name: groupName }), optional: params.every((p) => !p.required) }
}

/**
 * Build a single `FunctionParameterNode` for a query or header group.
 */
export function buildGroupParam(
  name: string,
  node: ast.OperationNode,
  params: ast.ParameterNode[],
  groupType: QueryGroupResult,
  resolver: PluginTs['resolver'],
): ast.FunctionParameterNode[] {
  if (groupType) {
    return [ast.createFunctionParameter({ name, type: groupType.type, optional: groupType.optional })]
  }
  if (params.length) {
    const structProps = params.map((p) => ({
      name: p.name,
      type: ast.createParamsType({ variant: 'reference', name: resolver.resolveParamName(node, p) }),
      optional: !p.required,
    }))
    return [
      ast.createFunctionParameter({
        name,
        type: ast.createParamsType({ variant: 'struct', properties: structProps }),
        optional: params.every((p) => !p.required),
      }),
    ]
  }
  return []
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

  const queryGroupType = resolveQueryGroupType(node, queryParams, resolver)

  const bodyType = node.requestBody?.content?.[0]?.schema ? ast.createParamsType({ variant: 'reference', name: resolver.resolveDataName(node) }) : undefined
  const bodyRequired = node.requestBody?.required ?? false

  const params: Array<ast.FunctionParameterNode | ast.ParameterGroupNode> = []

  // Path params
  if (pathParams.length) {
    const pathChildren = pathParams.map((p) =>
      ast.createFunctionParameter({ name: p.name, type: resolvePathParamType(node, p, resolver), optional: !p.required }),
    )
    params.push({
      kind: 'ParameterGroup',
      properties: pathChildren,
      inline: pathParamsType === 'inline',
      default: pathChildren.every((c) => c.optional) ? '{}' : undefined,
    })
  }

  // Request body
  if (bodyType) {
    params.push(ast.createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired }))
  }

  // Query params
  params.push(...buildGroupParam('params', node, queryParams, queryGroupType, resolver))

  return ast.createFunctionParameters({ params })
}

export function buildEnabledCheck(paramsNode: ast.FunctionParametersNode): string {
  const required: string[] = []
  for (const param of paramsNode.params) {
    if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
      const group = param as ast.ParameterGroupNode
      for (const child of group.properties) {
        if (!child.optional && child.default === undefined) {
          required.push(child.name)
        }
      }
    } else {
      const fp = param as ast.FunctionParameterNode
      if (!fp.optional && fp.default === undefined) {
        required.push(fp.name)
      }
    }
  }
  return required.join(' && ')
}

/**
 * Render a {@link ast.ParamsTypeNode} back to its TypeScript source form.
 */
export function printType(typeNode: ast.ParamsTypeNode | undefined): string {
  if (!typeNode) return 'unknown'
  if (typeNode.variant === 'reference') return typeNode.name
  if (typeNode.variant === 'member') return `${typeNode.base}['${typeNode.key}']`
  if (typeNode.variant === 'struct') {
    const parts = typeNode.properties.map((p) => {
      const typeStr = printType(p.type)
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p.name) ? p.name : JSON.stringify(p.name)
      return p.optional ? `${key}?: ${typeStr}` : `${key}: ${typeStr}`
    })
    return `{ ${parts.join('; ')} }`
  }
  return 'unknown'
}

/**
 * Rewrite selected parameter types in a {@link ast.FunctionParametersNode}
 * using a caller-supplied `wrapType` and `shouldWrap` predicate. Handles
 * both inline parameters and grouped/destructured ones.
 *
 * @example Vue's `MaybeRefOrGetter`
 * `transformParamTypes(p, { wrapType: (t) => \`MaybeRefOrGetter<${t}>\`, shouldWrap: (p) => p.name !== 'options' })`
 *
 * @example React's path-param getter union
 * `transformParamTypes(p, { wrapType: (t) => \`${t} | (() => ${t}) | undefined\`, shouldWrap: (p) => pathNames.has(p.name) })`
 */
export function transformParamTypes(
  paramsNode: ast.FunctionParametersNode,
  options: {
    wrapType: (inner: string) => string
    shouldWrap: (param: ast.FunctionParameterNode) => boolean
  },
): ast.FunctionParametersNode {
  const { wrapType, shouldWrap } = options
  const wrap = (p: ast.FunctionParameterNode): ast.FunctionParameterNode => {
    if (!p.type) return p
    return {
      ...p,
      type: ast.createParamsType({ variant: 'reference', name: wrapType(printType(p.type)) }),
    }
  }
  return ast.createFunctionParameters({
    params: paramsNode.params.map((param) => {
      if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
        const group = param as ast.ParameterGroupNode
        return {
          ...group,
          properties: group.properties.map((p) => (shouldWrap(p) ? wrap(p) : p)),
        }
      }
      const fp = param as ast.FunctionParameterNode
      return shouldWrap(fp) ? wrap(fp) : fp
    }),
  })
}
