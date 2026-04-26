import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'

export function transformName(name: string, type: string, transformers?: { name?: (name: string, type?: string) => string }): string {
  return transformers?.name?.(name, type) || name
}

/**
 * Build JSDoc comment lines from an OperationNode.
 */
export function getComments(node: ast.OperationNode): Array<string> {
  return [
    node.description && `@description ${node.description}`,
    node.summary && `@summary ${node.summary}`,
    node.deprecated && '@deprecated',
    `{@link ${node.path.replaceAll('{', ':').replaceAll('}', '')}}`,
  ].filter((x): x is string => Boolean(x))
}

/**
 * Resolve error type names from operation responses.
 */
export function resolveErrorNames(node: ast.OperationNode, tsResolver: PluginTs['resolver']): string[] {
  return node.responses
    .filter((r) => {
      const code = Number.parseInt(r.statusCode, 10)
      return code >= 400
    })
    .map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
}

/**
 * Resolve all status code type names from operation responses (for imports).
 */
export function resolveStatusCodeNames(node: ast.OperationNode, tsResolver: PluginTs['resolver']): string[] {
  return node.responses.map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
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

/**
 * Returns the set of param names that would appear in a tanstack-query `enabled` guard.
 * These are params that are required (non-optional) and have no default value.
 */
export function getEnabledParamNames(paramsNode: ast.FunctionParametersNode): Set<string> {
  const names = new Set<string>()
  for (const param of paramsNode.params) {
    if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
      const group = param as ast.ParameterGroupNode
      for (const child of group.properties) {
        if (!child.optional && child.default === undefined) {
          names.add(child.name)
        }
      }
    } else {
      const fp = param as ast.FunctionParameterNode
      if (!fp.optional && fp.default === undefined) {
        names.add(fp.name)
      }
    }
  }
  return names
}

/**
 * Returns a new FunctionParametersNode with the specified params marked as optional.
 * When all properties in a ParameterGroup become optional, adds a `{}` default.
 */
export function makeEnabledParamsOptional(paramsNode: ast.FunctionParametersNode, enabledNames: Set<string>): ast.FunctionParametersNode {
  if (enabledNames.size === 0) return paramsNode
  const newParams = paramsNode.params.map((param) => {
    if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
      const group = param as ast.ParameterGroupNode
      const newProperties = group.properties.map((p) => (enabledNames.has(p.name) ? { ...p, optional: true } : p))
      const allOptional = newProperties.every((p) => p.optional)
      // For inline groups, 'default' is not used by the printer — only affects PARAM_RANK sorting.
      // Adding it would demote the group to rank 2 (withDefault), causing path params to sort after
      // body/query params. Only add the default for non-inline (destructured) groups.
      const newDefault = !group.inline && allOptional ? '{}' : group.default
      return { ...group, properties: newProperties, default: newDefault } as ast.ParameterGroupNode
    }
    const fp = param as ast.FunctionParameterNode
    if (enabledNames.has(fp.name)) {
      return { ...fp, optional: true } as ast.FunctionParameterNode
    }
    return fp
  })
  return ast.createFunctionParameters({ params: newParams })
}

/**
 * Build mutation arg params for paramsToTrigger mode.
 * Contains pathParams + data + queryParams + headers (all flattened, for type alias).
 */
export function buildMutationArgParams(
  node: ast.OperationNode,
  options: {
    paramsCasing: 'camelcase' | undefined
    resolver: PluginTs['resolver']
  },
): ast.FunctionParametersNode {
  const { paramsCasing, resolver } = options

  const casedParams = ast.caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const queryGroupType = resolveQueryGroupType(node, queryParams, resolver)
  const headerGroupType = resolveHeaderGroupType(node, headerParams, resolver)

  const bodyType = node.requestBody?.content?.[0]?.schema ? ast.createParamsType({ variant: 'reference', name: resolver.resolveDataName(node) }) : undefined
  const bodyRequired = node.requestBody?.required ?? false

  const params: Array<ast.FunctionParameterNode | ast.ParameterGroupNode> = []

  // Path params (individual entries)
  for (const p of pathParams) {
    params.push(ast.createFunctionParameter({ name: p.name, type: resolvePathParamType(node, p, resolver), optional: !p.required }))
  }

  // Request body
  if (bodyType) {
    params.push(ast.createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired }))
  }

  // Query params
  params.push(...buildGroupParam('params', node, queryParams, queryGroupType, resolver))

  // Header params
  params.push(...buildGroupParam('headers', node, headerParams, headerGroupType, resolver))

  return ast.createFunctionParameters({ params })
}
