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
  return Boolean(validator.request || validator.response)
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
 * Returns `'zod'` when query-parameters parsing is enabled, `null` otherwise. Only the object form
 * `{ request: 'zod' }` enables it.
 */
export function resolveQueryParamsValidator(validator: ValidatorOptions | undefined): 'zod' | null {
  if (!validator || validator === 'zod') return null
  return validator.request ?? null
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
 * The zod validation a generated client applies to a success response body.
 */
export type ZodResponseParse = {
  /**
   * The success-only response schema name that the generated code calls `.parse(data)` on.
   */
  expression: string
  /**
   * Schema names the generated file imports from the zod plugin output.
   */
  importNames: Array<string>
}

/**
 * Resolves the zod expression a generated client validates a success response with. Only success
 * (2xx) bodies reach the parse under the throw-on-error contract, so the success-only
 * `<operation>ResponseSchema` is used; error bodies are never zod-parsed.
 */
export function buildZodResponseParse(node: ast.OperationNode, zodResolver: ResolverZod): ZodResponseParse | null {
  const name = zodResolver.resolveResponseName?.(node)
  return name ? { expression: name, importNames: [name] } : null
}

/**
 * Resolves the zod expression a generated client validates an error body with on the non-throw path.
 * Uses the error-only `<operation>ErrorSchema` (the union of non-2xx statuses); returns `null` when the
 * operation documents no error responses with a schema.
 */
export function buildZodErrorParse(node: ast.OperationNode, zodResolver: ResolverZod): ZodResponseParse | null {
  const hasErrorResponse = node.responses.some((res) => !isSuccessStatusCode(res.statusCode) && res.content?.some((entry) => entry.schema))
  if (!hasErrorResponse) return null
  const name = zodResolver.resolveErrorName?.(node)
  return name ? { expression: name, importNames: [name] } : null
}
