import { camelCase, isValidVarName } from '@internals/utils'
import type { OperationNode, ParameterNode } from '@kubb/ast'

type Store<TKey, TValue> = {
  has(key: TKey): boolean
  get(key: TKey): TValue | undefined
  set(key: TKey, value: TValue): unknown
}

/**
 * Wraps `factory` with a keyed cache backed by the provided store. Pass a `WeakMap` for object
 * keys or a `Map` for primitive keys; nest two calls to memoize a two-argument function.
 */
function memoize<TKey, TValue>(store: Store<TKey, TValue>, factory: (key: TKey) => TValue): (key: TKey) => TValue {
  return (key: TKey): TValue => {
    if (store.has(key)) return store.get(key)!
    const value = factory(key)
    store.set(key, value)
    return value
  }
}

const caseParamsMemo = memoize(new WeakMap<Array<ParameterNode>, (casing: string) => Array<ParameterNode>>(), (params) =>
  memoize(new Map<string, Array<ParameterNode>>(), (casing: string) =>
    params.map((param) => {
      const transformed = casing === 'camelcase' || !isValidVarName(param.name) ? camelCase(param.name) : param.name
      return { ...param, name: transformed }
    }),
  ),
)

/**
 * Applies casing rules to parameter names and returns a new array without mutating the input.
 *
 * Run it before handing parameters to schema builders so output property keys get the right casing
 * while `OperationNode.parameters` stays intact for other consumers. When `casing` is unset, the
 * original array is returned unchanged.
 */
export function caseParams(params: Array<ParameterNode>, casing: 'camelcase' | undefined): Array<ParameterNode> {
  if (!casing) return params
  return caseParamsMemo(params)(casing)
}

/**
 * Resolver interface for building operation parameters.
 *
 * `ResolverTs` from `@kubb/plugin-ts` satisfies this interface and can be passed directly.
 */
export type OperationParamsResolver = {
  /**
   * Resolves the type name for an individual parameter.
   *
   * @example Individual path parameter name
   * `resolver.resolveParamName(node, param) // → 'DeletePetPathPetId'`
   */
  resolveParamName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the request body type name.
   *
   * @example Request body type name
   * `resolver.resolveDataName(node) // → 'CreatePetData'`
   */
  resolveDataName(node: OperationNode): string
  /**
   * Resolves the grouped path parameters type name.
   * When the return value equals `resolveParamName`, no indexed access is emitted.
   *
   * @example Grouped path params type name
   * `resolver.resolvePathParamsName(node, param) // → 'DeletePetPathParams'`
   */
  resolvePathParamsName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the grouped query parameters type name.
   * When the return value equals `resolveParamName`, an inline struct type is emitted instead.
   *
   * @example Grouped query params type name
   * `resolver.resolveQueryParamsName(node, param) // → 'FindPetsByStatusQueryParams'`
   */
  resolveQueryParamsName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the grouped header parameters type name.
   * When the return value equals `resolveParamName`, an inline struct type is emitted instead.
   *
   * @example Grouped header params type name
   * `resolver.resolveHeaderParamsName(node, param) // → 'DeletePetHeaderParams'`
   */
  resolveHeaderParamsName(node: OperationNode, param: ParameterNode): string
}

export function buildParamsMapping<TParam extends { name: string }>(
  originalParams: ReadonlyArray<TParam>,
  mappedParams: ReadonlyArray<TParam>,
): Record<string, string> | null {
  const mapping: Record<string, string> = {}
  let hasChanged = false

  originalParams.forEach((param, i) => {
    const mappedName = mappedParams[i]?.name ?? param.name
    mapping[param.name] = mappedName

    if (param.name !== mappedName) {
      hasChanged = true
    }
  })

  return hasChanged ? mapping : null
}

export function buildTransformedParamsMapping<TParam extends { name: string }>(
  params: ReadonlyArray<TParam>,
  transformName: (name: string) => string,
): Record<string, string> | null {
  if (!params.length) {
    return null
  }

  return buildParamsMapping(
    params,
    params.map((param) => ({ ...param, name: transformName(param.name) })),
  )
}
