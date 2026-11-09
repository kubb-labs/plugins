import { isSuccessStatusCode } from '@internals/shared'
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
 * Resolves the zod schema name a generated client validates an error body with on the non-throw path.
 * Uses the error-only `<operation>ErrorSchema` (the union of non-2xx statuses); returns `null` when the
 * operation documents no error responses with a schema.
 */
export function buildZodErrorParse(node: ast.OperationNode, zodResolver: ResolverZod): string | null {
  if (!getErrorStatusCodes(node).length) return null
  return zodResolver.response.error?.(node) || null
}

/** Prints the statuses `<operation>ErrorSchema` covers, such as `[404, '5XX']`, or `null` when a `default` response covers them all. */
export function buildErrorStatusLiteral(node: ast.OperationNode): string | null {
  const statusCodes = getErrorStatusCodes(node)
  if (!statusCodes.length || statusCodes.includes('default')) return null
  return `[${statusCodes.map((statusCode) => (/^\d+$/.test(statusCode) ? statusCode : stringify(statusCode))).join(', ')}]`
}

// The same selection plugin-zod uses for `<operation>ErrorSchema`: every non-2xx response with a schema.
function getErrorStatusCodes(node: ast.OperationNode): Array<string> {
  return node.responses.filter((res) => !isSuccessStatusCode(res.statusCode) && res.content?.some((entry) => entry.schema)).map((res) => String(res.statusCode))
}
