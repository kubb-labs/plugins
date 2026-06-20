import type { ast } from '@kubb/core'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ParserOptions } from '../types.ts'
import { buildZodResponseParse, resolveRequestParser, resolveResponseParser } from './parser.ts'

/**
 * The per-call parser expressions a generated function wires into its request config. Both run
 * through the runtime's `parser.request` / `parser.response` hooks rather than inline parse calls,
 * and the response parser only ever sees success (2xx) bodies.
 */
export type ParserHooks = {
  /**
   * Expression for the `parser.request` hook, or `null` when request parsing is off.
   */
  request: string | null
  /**
   * Expression for the `parser.response` hook, or `null` when response parsing is off.
   */
  response: string | null
  /**
   * Zod schema names the generated file imports from the zod plugin output.
   */
  importedZodNames: Array<string>
}

/**
 * Builds the parser-hook expressions for one operation. Request parsing runs before the send;
 * response parsing runs on the success body only. Returns `null` expressions when the matching
 * parser direction is disabled or the schema is absent.
 */
export function buildParserHooks({
  node,
  parser,
  zodResolver,
}: {
  node: ast.OperationNode
  parser: ParserOptions | undefined
  zodResolver: ResolverZod | null | undefined
}): ParserHooks {
  const importedZodNames: Array<string> = []

  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const zodRequestName = zodResolver && resolveRequestParser(parser) === 'zod' && hasRequestBody ? zodResolver.resolveDataName?.(node) : null
  const request = zodRequestName ? `(data: unknown) => ${zodRequestName}.parse(data)` : null
  if (zodRequestName) importedZodNames.push(zodRequestName)

  const responseParse = zodResolver && resolveResponseParser(parser) === 'zod' ? buildZodResponseParse(node, zodResolver) : null
  const response = responseParse ? `(data: unknown) => ${responseParse.expression}.parse(data)` : null
  if (responseParse) importedZodNames.push(...responseParse.importNames)

  return { request, response, importedZodNames }
}
