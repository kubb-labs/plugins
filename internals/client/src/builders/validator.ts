import type { ast } from '@kubb/core'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ParserOptions } from '../types.ts'
import { buildZodResponseParse, resolveRequestParser, resolveResponseParser } from './parser.ts'

/**
 * The per-call validator expressions a generated function wires into its request config. Both run
 * through the runtime's `requestValidator` / `responseValidator` hooks rather than inline parse
 * calls, and the response validator only ever sees success (2xx) bodies.
 */
export type ValidatorHooks = {
  /**
   * Expression for the `requestValidator` field, or `null` when request parsing is off.
   */
  requestValidator: string | null
  /**
   * Expression for the `responseValidator` field, or `null` when response parsing is off.
   */
  responseValidator: string | null
  /**
   * Zod schema names the generated file imports from the zod plugin output.
   */
  importedZodNames: Array<string>
}

/**
 * Builds the validator-hook expressions for one operation. Request validation runs before the send;
 * response validation runs on the success body only. Returns `null` expressions when the matching
 * parser direction is disabled or the schema is absent.
 */
export function buildValidatorHooks({
  node,
  parser,
  zodResolver,
}: {
  node: ast.OperationNode
  parser: ParserOptions | undefined
  zodResolver: ResolverZod | null | undefined
}): ValidatorHooks {
  const importedZodNames: Array<string> = []

  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const zodRequestName = zodResolver && resolveRequestParser(parser) === 'zod' && hasRequestBody ? zodResolver.resolveDataName?.(node) : null
  const requestValidator = zodRequestName ? `(data: unknown) => ${zodRequestName}.parse(data)` : null
  if (zodRequestName) importedZodNames.push(zodRequestName)

  const responseParse = zodResolver && resolveResponseParser(parser) === 'zod' ? buildZodResponseParse(node, zodResolver) : null
  const responseValidator = responseParse ? `(data: unknown) => ${responseParse.expression}.parse(data)` : null
  if (responseParse) importedZodNames.push(...responseParse.importNames)

  return { requestValidator, responseValidator, importedZodNames }
}
