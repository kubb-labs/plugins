import { camelCase } from '@internals/utils'
import type { ast } from 'kubb/kit'

const caseParamsCache = new WeakMap<Array<ast.ParameterNode>, Array<ast.ParameterNode>>()

/**
 * Applies camelCase to parameter names and returns a new array without mutating the input.
 *
 * Run it before handing parameters to schema builders so output property keys get the right casing
 * while `OperationNode.parameters` stays intact for other consumers. When `casing` is unset, the
 * original array is returned unchanged. Results are cached per input array.
 */
export function caseParams(params: Array<ast.ParameterNode>, casing: 'camelcase' | undefined): Array<ast.ParameterNode> {
  if (!casing) return params

  const cached = caseParamsCache.get(params)
  if (cached) return cached

  const result = params.map((param) => ({ ...param, name: camelCase(param.name) }))
  caseParamsCache.set(params, result)
  return result
}

/**
 * Drops parameters that collapse to the same property identity once camelCased, keeping the first.
 *
 * Some specs declare the same parameter twice under different casings (for example AWS S3 lists both
 * `max-uploads` and `MaxUploads`). Both resolve to one output property, so emitting both would yield
 * an object type with a duplicate member, which TypeScript rejects. De-duplicate by the camelCased
 * identity so the resulting group is collision-free regardless of the names each caller carries.
 */
export function dedupeByCasedName(params: Array<ast.ParameterNode>): Array<ast.ParameterNode> {
  const seen = new Set<string>()

  return params.filter((param) => {
    const key = camelCase(param.name)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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
