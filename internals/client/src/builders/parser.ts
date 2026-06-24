import { isSuccessStatusCode } from '@internals/shared'
import type { ast } from '@kubb/core'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ParserOptions } from '../types.ts'

/**
 * Returns `true` when any direction of the parser uses zod (used for dependency checks).
 */
export function isParserEnabled(parser: ParserOptions | undefined): boolean {
  if (!parser) return false
  if (parser === 'zod') return true
  return Boolean(parser.request || parser.response)
}

/**
 * Returns `'zod'` when request body parsing is enabled, `null` otherwise. The string shorthand
 * `'zod'` validates the response only, so it does not enable request parsing.
 */
export function resolveRequestParser(parser: ParserOptions | undefined): 'zod' | null {
  if (!parser || parser === 'zod') return null
  return parser.request ?? null
}

/**
 * Returns `'zod'` when query-parameters parsing is enabled, `null` otherwise. Only the object form
 * `{ request: 'zod' }` enables it.
 */
export function resolveQueryParamsParser(parser: ParserOptions | undefined): 'zod' | null {
  if (!parser || parser === 'zod') return null
  return parser.request ?? null
}

/**
 * Returns `'zod'` when response parsing is enabled, `null` otherwise. The string shorthand `'zod'`
 * maps to response parsing.
 */
export function resolveResponseParser(parser: ParserOptions | undefined): 'zod' | null {
  if (!parser) return null
  if (parser === 'zod') return 'zod'
  return parser.response ?? null
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
