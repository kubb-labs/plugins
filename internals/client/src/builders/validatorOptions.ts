import { isSuccessStatusCode } from '@internals/shared'
import type { ast } from 'kubb/kit'
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
 * Resolves the zod schema name a generated client validates an error body with on the non-throw path.
 * Uses the error-only `<operation>ErrorSchema` (the union of non-2xx statuses); returns `null` when the
 * operation documents no error responses with a schema.
 */
export function buildZodErrorParse(node: ast.OperationNode, zodResolver: ResolverZod): string | null {
  const hasErrorResponse = node.responses.some((res) => !isSuccessStatusCode(res.statusCode) && res.content?.some((entry) => entry.schema))
  if (!hasErrorResponse) return null
  return zodResolver.response.error?.(node) || null
}
