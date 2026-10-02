import { getOperationParameters } from '@internals/shared'
import type { ast } from 'kubb/kit'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ValidatorOptions } from '../types.ts'
import { buildZodErrorParse, buildZodResponseParse, resolveParamsValidator, resolveRequestValidator, resolveResponseValidator } from './validatorOptions.ts'

/**
 * The per-call validator references a generated function wires into its request config. Each hook is
 * the bare schema reference passed to the runtime's `validator.request` / `validator.path` /
 * `validator.query` / `validator.headers` / `validator.response` / `validator.error` slot; `client.ts`
 * runs it through `validateStandardSchema`. The response validator only ever sees success (2xx) bodies.
 */
export type ValidatorHooks = {
  /**
   * Schema reference for the `validator.request` hook, or `null` when request validation is off.
   */
  request: string | null
  /**
   * Schema reference for the `validator.path` hook, or `null` when params validation is off or the
   * operation has no path params.
   */
  path: string | null
  /**
   * Schema reference for the `validator.query` hook, or `null` when params validation is off or the
   * operation has no query params.
   */
  query: string | null
  /**
   * Schema reference for the `validator.headers` hook, or `null` when params validation is off or the
   * operation has no header params.
   */
  headers: string | null
  /**
   * Schema reference for the `validator.response` hook, or `null` when response validation is off.
   */
  response: string | null
  /**
   * Schema reference for the `validator.error` hook, or `null` when error validation is off or the
   * operation documents no error responses. The runtime runs this on the error body when a non-2xx
   * call does not throw.
   */
  error: string | null
  /**
   * Zod schema names the generated file imports from the zod plugin output.
   */
  importedZodNames: Array<string>
}

/**
 * Builds the validator-hook references for one operation. Request body and params validation run before the send.
 * Response validation runs on the success body only. Returns `null` references when the matching
 * direction is disabled or the schema is absent.
 */
export function buildValidatorHooks({
  node,
  validator,
  zodResolver,
}: {
  node: ast.OperationNode
  validator: ValidatorOptions | undefined
  zodResolver: ResolverZod | null | undefined
}): ValidatorHooks {
  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const request = zodResolver && resolveRequestValidator(validator) === 'zod' && hasRequestBody ? zodResolver.response.body(node) : null

  const paramGroups = getOperationParameters(node)
  const resolveParamsName = (kind: 'path' | 'query' | 'headers', params: Array<ast.ParameterNode>): string | null =>
    zodResolver && resolveParamsValidator(validator) === 'zod' && params.length > 0 ? zodResolver.param[kind](node, params[0]!) : null
  const path = resolveParamsName('path', paramGroups.path)
  const query = resolveParamsName('query', paramGroups.query)
  const headers = resolveParamsName('headers', paramGroups.header)

  const responseParse = zodResolver && resolveResponseValidator(validator) === 'zod' ? buildZodResponseParse(node, zodResolver) : null
  const response = responseParse ? responseParse.expression : null

  const errorParse = zodResolver && resolveResponseValidator(validator) === 'zod' ? buildZodErrorParse(node, zodResolver) : null
  const error = errorParse ? errorParse.expression : null

  const importedZodNames = [...(responseParse?.importNames ?? []), ...(errorParse?.importNames ?? []), request, path, query, headers].filter(
    (name): name is string => Boolean(name),
  )

  const headersValidator = headers ? `toCaseInsensitiveLooseObjectStandardSchema(${headers}, ${headers}.shape)` : null

  return { request, path, query, headers: headersValidator, response, error, importedZodNames }
}
