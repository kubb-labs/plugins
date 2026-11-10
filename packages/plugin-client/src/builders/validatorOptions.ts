import { isSuccessStatusCode, toStatusKey } from '@internals/shared'
import { stringify } from '@internals/utils'
import type { ast } from '@kubb/kit'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ValidatorOptions } from '../types.ts'

/**
 * Returns `true` when any direction of the validator uses zod (used for dependency checks).
 */
export function isValidatorEnabled(validator: ValidatorOptions | undefined): boolean {
  if (!validator) return false
  if (validator === 'zod') return true
  return Boolean(validator.request || validator.params || validator.response)
}

/**
 * Returns `'zod'` when request body parsing is enabled, `null` otherwise. The string shorthand
 * `'zod'` validates the response only, so it does not enable request parsing.
 */
export function resolveRequestValidator(validator: ValidatorOptions | undefined): 'zod' | null {
  if (!validator || validator === 'zod') return null
  return validator.request ?? null
}

/**
 * Returns `'zod'` when path, query, and header params parsing is enabled, `null` otherwise. Only the
 * object form `{ params: 'zod' }` enables it.
 */
export function resolveParamsValidator(validator: ValidatorOptions | undefined): 'zod' | null {
  if (!validator || validator === 'zod') return null
  return validator.params ?? null
}

/**
 * Returns `'zod'` when response parsing is enabled, `null` otherwise. The string shorthand `'zod'`
 * maps to response parsing.
 */
export function resolveResponseValidator(validator: ValidatorOptions | undefined): 'zod' | null {
  if (!validator) return null
  if (validator === 'zod') return 'zod'
  return validator.response ?? null
}

/**
 * Builds the `validator.error` map of a call, one plugin-zod `<operation>StatusNNNSchema` per non-2xx response with a
 * schema, such as `{ 404: getPetStatus404Schema, '5xx': getPetStatus5xxSchema }`. Returns `null` without one.
 */
export function buildZodErrorParse(node: ast.OperationNode, zodResolver: ResolverZod): { literal: string; names: Array<string> } | null {
  const entries = node.responses
    .filter((res) => !isSuccessStatusCode(res.statusCode) && res.content?.some((entry) => entry.schema))
    .map((res) => ({ key: toStatusKey(res.statusCode), name: zodResolver.response.status(node, res.statusCode) }))
  if (!entries.length) return null
  const literal = entries.map(({ key, name }) => `${/^\d+$/.test(key) ? key : stringify(key)}: ${name}`).join(', ')
  return { literal: `{ ${literal} }`, names: entries.map(({ name }) => name) }
}
