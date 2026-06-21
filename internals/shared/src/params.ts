import { camelCase } from '@internals/utils'
import type { ParameterNode } from '@kubb/ast'

const caseParamsCache = new WeakMap<Array<ParameterNode>, Array<ParameterNode>>()

/**
 * Applies camelCase to parameter names and returns a new array without mutating the input.
 *
 * Run it before handing parameters to schema builders so output property keys get the right casing
 * while `OperationNode.parameters` stays intact for other consumers. When `casing` is unset, the
 * original array is returned unchanged. Results are cached per input array.
 */
export function caseParams(params: Array<ParameterNode>, casing: 'camelcase' | undefined): Array<ParameterNode> {
  if (!casing) return params

  const cached = caseParamsCache.get(params)
  if (cached) return cached

  const result = params.map((param) => ({ ...param, name: camelCase(param.name) }))
  caseParamsCache.set(params, result)
  return result
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
