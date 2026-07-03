import { caseParams } from '@internals/shared'
import type { OperationParamsResolver } from '@internals/shared'
import type { OperationNode, ParameterNode } from 'kubb/ast'
import { createFunctionParameter, createFunctionParameters, createIndexedAccessType, createTypeLiteral } from './functionParams.ts'
import type { FunctionParameterNode, FunctionParametersNode, TypeExpression, TypeLiteralNode } from './functionParams.ts'

/**
 * Named type for a group of parameters (query or header) emitted as a single typed parameter.
 */
type ParamGroupType = {
  /**
   * Type expression for the group, a plain group-name reference.
   */
  type: TypeExpression
  /**
   * Whether the parameter group is optional.
   */
  optional: boolean
}

/**
 * A single member of a destructured parameter group, fed to `createFunctionParameter({ properties })`.
 */
type GroupProperty = {
  name: string
  type: TypeExpression
  optional?: boolean
}

/**
 * Options for {@link createOperationParams}.
 */
export type CreateOperationParamsOptions = {
  /**
   * How all operation parameters are grouped in the function signature.
   * - `'object'` wraps all params into a single destructured object `{ petId, data, params }`
   * - `'inline'` emits each param category as a separate top-level parameter
   */
  paramsType: 'object' | 'inline'
  /**
   * How path parameters are emitted when `paramsType` is `'inline'`.
   * - `'object'` groups them as `{ petId, storeId }: PathParams`
   * - `'inline'` spreads them as individual parameters `petId: string, storeId: string`
   * - `'inlineSpread'` emits a single rest parameter `...pathParams: PathParams`
   */
  pathParamsType: 'object' | 'inline' | 'inlineSpread'
  /**
   * Converts parameter names to camelCase before output.
   */
  paramsCasing?: 'camelcase'
  /**
   * Resolver for parameter and request body type names.
   * Pass `ResolverTs` from `@kubb/plugin-ts` directly.
   * When omitted, falls back to the schema primitive or `'unknown'`.
   */
  resolver?: OperationParamsResolver
  /**
   * Default value for the path parameters binding when `pathParamsType` is `'object'`.
   * Falls back to `'{}'` when all path params are optional.
   */
  pathParamsDefault?: string
  /**
   * Extra parameters appended after the standard operation parameters.
   *
   * @example Plugin-specific trailing parameter
   * ```ts
   * extraParams: [createFunctionParameter({ name: 'options', type: 'Partial<RequestOptions>', default: '{}' })]
   * ```
   */
  extraParams?: Array<FunctionParameterNode>
  /**
   * Override the default parameter names used for body, query, header, and rest-path groups.
   *
   * Useful when targeting languages or frameworks with different naming conventions.
   *
   * @default { data: 'data', params: 'params', headers: 'headers', path: 'pathParams' }
   */
  paramNames?: {
    /**
     * Name for the request body parameter.
     * @default 'data'
     */
    data?: string
    /**
     * Name for the query parameters group parameter.
     * @default 'params'
     */
    params?: string
    /**
     * Name for the header parameters group parameter.
     * @default 'headers'
     */
    headers?: string
    /**
     * Name for the rest path-parameters parameter when `pathParamsType` is `'inlineSpread'`.
     * @default 'pathParams'
     */
    path?: string
  }
  /**
   * Transforms every resolved type name before it lands in a parameter node, for framework-level
   * type wrappers.
   *
   * @example Vue Query, wrap every parameter type with `MaybeRefOrGetter`
   * `typeWrapper: (t) => \`MaybeRefOrGetter<${t}>\``
   */
  typeWrapper?: (type: string) => string
}

/**
 * Resolves the {@link TypeExpression} for an individual parameter.
 *
 * Without a resolver, it falls back to the schema primitive (a plain type-name string). When the
 * parameter belongs to a named group, it emits an `IndexedAccessType` like `GroupParams['petId']`,
 * otherwise the resolved individual name.
 */
function resolveParamType({
  node,
  param,
  resolver,
}: {
  node: OperationNode
  param: ParameterNode
  resolver: OperationParamsResolver | undefined
}): TypeExpression {
  if (!resolver) {
    return param.schema.primitive ?? 'unknown'
  }

  const individualName = resolver.resolveParamName(node, param)

  const groupLocation = param.in === 'path' || param.in === 'query' || param.in === 'header' ? param.in : undefined

  const groupResolvers = {
    path: resolver.resolvePathParamsName,
    query: resolver.resolveQueryParamsName,
    header: resolver.resolveHeaderParamsName,
  } as const

  const groupName = groupLocation ? groupResolvers[groupLocation].call(resolver, node, param) : undefined

  if (groupName && groupName !== individualName) {
    return createIndexedAccessType({ target: groupName, key: param.name })
  }

  return individualName
}

/**
 * Derives a {@link ParamGroupType} for a query or header group from the resolver.
 *
 * Returns `null` when there is no resolver, no params, or the group name equals the
 * individual param name (so there is no real group to emit).
 */
function resolveGroupType({
  node,
  params,
  group,
  resolver,
}: {
  node: OperationNode
  params: Array<ParameterNode>
  group: 'query' | 'header'
  resolver: OperationParamsResolver | undefined
}): ParamGroupType | null {
  if (!resolver || !params.length) {
    return null
  }
  const firstParam = params[0]!
  const groupMethod = group === 'query' ? resolver.resolveQueryParamsName : resolver.resolveHeaderParamsName
  const groupName = groupMethod.call(resolver, node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) {
    return null
  }
  return { type: groupName, optional: params.every((p) => !p.required) }
}

/**
 * Converts an `OperationNode` into function parameters for code generation.
 *
 * Centralizes parameter grouping logic for all plugins. `paramsType` chooses between one
 * destructured object parameter (`object`) and separate top-level parameters (`inline`), while
 * `pathParamsType` controls how path params render in inline mode. Provide a `resolver` for type
 * name resolution and `extraParams` for plugin-specific trailing parameters such as an `options` object.
 */
export function createOperationParams(node: OperationNode, options: CreateOperationParamsOptions): FunctionParametersNode {
  const { paramsType, pathParamsType, paramsCasing, resolver, pathParamsDefault, extraParams = [], paramNames, typeWrapper } = options

  const dataName = paramNames?.data ?? 'data'
  const paramsName = paramNames?.params ?? 'params'
  const headersName = paramNames?.headers ?? 'headers'
  const pathName = paramNames?.path ?? 'pathParams'

  const wrapType = (type: string): string => (typeWrapper ? typeWrapper(type) : type)
  // typeWrapper takes a type-name string, so only plain references are wrapped.
  // TypeLiteral and IndexedAccessType expressions are pre-resolved and pass through unchanged.
  const wrapTypeExpression = (type: TypeExpression): TypeExpression => (typeof type === 'string' ? wrapType(type) : type)

  const casedParams = caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const toProperty = (param: ParameterNode): GroupProperty => ({
    name: param.name,
    type: wrapTypeExpression(resolveParamType({ node, param, resolver })),
    optional: !param.required,
  })
  const emptyObjectDefault = (props: Array<GroupProperty>): string | undefined => (props.every((p) => p.optional) ? '{}' : undefined)

  const bodyType = node.requestBody?.content?.[0]?.schema ? wrapType(resolver?.resolveDataName(node) ?? 'unknown') : undefined
  const bodyProperty: Array<GroupProperty> = bodyType ? [{ name: dataName, type: bodyType, optional: !(node.requestBody?.required ?? false) }] : []

  const trailingGroups: Array<BuildGroupArgs> = [
    { name: paramsName, node, params: queryParams, groupType: resolveGroupType({ node, params: queryParams, group: 'query', resolver }), resolver, wrapType },
    {
      name: headersName,
      node,
      params: headerParams,
      groupType: resolveGroupType({ node, params: headerParams, group: 'header', resolver }),
      resolver,
      wrapType,
    },
  ]

  const params: Array<FunctionParameterNode> = []

  if (paramsType === 'object') {
    const children = [...pathParams.map(toProperty), ...bodyProperty, ...trailingGroups.flatMap(buildGroupProperty)]
    if (children.length) {
      params.push(createFunctionParameter({ properties: children, default: emptyObjectDefault(children) }))
    }
  } else {
    if (pathParamsType === 'inlineSpread' && pathParams.length) {
      const spreadType = resolver?.resolvePathParamsName(node, pathParams[0]!)
      params.push(createFunctionParameter({ name: pathName, type: spreadType ? wrapType(spreadType) : undefined, rest: true }))
    } else if (pathParamsType === 'inline') {
      params.push(...pathParams.map((p) => createFunctionParameter(toProperty(p))))
    } else if (pathParams.length) {
      const pathChildren = pathParams.map(toProperty)
      params.push(createFunctionParameter({ properties: pathChildren, default: pathParamsDefault ?? emptyObjectDefault(pathChildren) }))
    }

    params.push(...bodyProperty.map((p) => createFunctionParameter(p)))
    params.push(...trailingGroups.flatMap(buildGroupParam))
  }

  params.push(...extraParams)

  return createFunctionParameters({ params })
}

/**
 * Shared arguments for building a query or header parameter group.
 */
type BuildGroupArgs = {
  name: string
  node: OperationNode
  params: Array<ParameterNode>
  groupType: ParamGroupType | null
  resolver: OperationParamsResolver | undefined
  wrapType: (type: string) => string
}

/**
 * Builds the property descriptor for a query or header group.
 * Returns an empty array when there are no params to emit.
 *
 * A pre-resolved `groupType` emits `name: GroupType`. Otherwise it builds an inline
 * {@link TypeLiteralNode} from the individual params.
 */
function buildGroupProperty({ name, node, params, groupType, resolver, wrapType }: BuildGroupArgs): Array<GroupProperty> {
  if (groupType) {
    const type = typeof groupType.type === 'string' ? wrapType(groupType.type) : groupType.type
    return [{ name, type, optional: groupType.optional }]
  }
  if (params.length) {
    return [{ name, type: buildTypeLiteral({ node, params, resolver }), optional: params.every((p) => !p.required) }]
  }
  return []
}

/**
 * Builds a single {@link FunctionParameterNode} for a query or header group.
 * Returns an empty array when there are no params to emit.
 */
function buildGroupParam(args: BuildGroupArgs): Array<FunctionParameterNode> {
  return buildGroupProperty(args).map((p) => createFunctionParameter(p))
}

/**
 * Builds a {@link TypeLiteralNode} for an inline anonymous type grouping named fields.
 *
 * Used when query or header parameters have no dedicated group type name.
 */
function buildTypeLiteral({
  node,
  params,
  resolver,
}: {
  node: OperationNode
  params: Array<ParameterNode>
  resolver: OperationParamsResolver | undefined
}): TypeLiteralNode {
  return createTypeLiteral({
    members: params.map((p) => ({
      name: p.name,
      type: resolveParamType({ node, param: p, resolver }),
      optional: !p.required,
    })),
  })
}
