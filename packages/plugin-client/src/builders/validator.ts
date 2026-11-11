import { getOperationParameters } from '@internals/shared'
import type { ast } from '@kubb/kit'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ValidatorOptions } from '../types.ts'
import { buildZodErrorParse, resolveParamsValidator, resolveRequestValidator, resolveResponseValidator } from './validatorOptions.ts'

/**
 * The per-call validator references a generated function wires into its request config. Each hook is
 * the bare schema reference passed to the runtime's `validator.request` / `validator.path` /
 * `validator.query` / `validator.headers` / `validator.cookies` / `validator.response` / `validator.error` slot. `client.ts`
 * runs it through `validateStandardSchema`. The response validator only ever sees success (2xx) bodies.
 */
export type ValidatorHooks = {
  /**
   * Schema reference for the `validator.request` hook, or `null` when request validation is off.
   */
  request: string | null
  /**
   * Schema references for the `validator.path` / `query` / `headers` / `cookies` hooks (`headers` wrapped in
   * `toHeadersStandardSchema`), or `null` when params validation is off or the group is empty.
   */
  path: string | null
  query: string | null
  headers: string | null
  cookies: string | null
  /**
   * Schema reference for the `validator.response` hook, or `null` when response validation is off.
   */
  response: string | null
  /** Per-status schema map for `validator.error`, such as `{ 404: getPetStatus404Schema }`, or `null` when off or absent. */
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
  const parsesResponse = zodResolver && resolveResponseValidator(validator) === 'zod'

  // Success responses validate with the success-only `<operation>ResponseSchema`; error bodies with the schema of their status.
  // plugin-zod emits that schema only for an operation with a response body schema.
  const hasResponseSchema = node.responses.some((res) => res.content?.some((entry) => entry.schema))
  const response = parsesResponse && hasResponseSchema ? zodResolver.response.response(node) || null : null
  const errorParse = parsesResponse ? buildZodErrorParse(node, zodResolver) : null
  const request = zodResolver && resolveRequestValidator(validator) === 'zod' && hasRequestBody ? zodResolver.response.body(node) || null : null

  const paramGroups = getOperationParameters(node)
  const resolveParamsName = (kind: 'path' | 'query' | 'headers' | 'cookies', params: Array<ast.ParameterNode>): string | null =>
    zodResolver && resolveParamsValidator(validator) === 'zod' && params.length > 0 ? zodResolver.param[kind](node, params[0]!) : null
  const path = resolveParamsName('path', paramGroups.path)
  const query = resolveParamsName('query', paramGroups.query)
  const headers = resolveParamsName('headers', paramGroups.header)
  const cookies = resolveParamsName('cookies', paramGroups.cookie)

  // Order is output: the generated file imports the response schema, then the error schemas, then the request body and params schemas.
  const importedZodNames = [response, ...(errorParse?.names ?? []), request, path, query, headers, cookies].filter((name): name is string => Boolean(name))

  const headersValidator = headers ? `toHeadersStandardSchema(${headers}, ${headers}.shape)` : null

  return { request, path, query, headers: headersValidator, cookies, response, error: errorParse?.literal ?? null, importedZodNames }
}

/**
 * Prints the `validator: { … }` entry of a call config from the hooks named in `keys`, or `null` when none is set.
 * The entry spreads `config.validator` last, so a per-call hook overrides the generated one for its key only.
 */
export function buildValidatorLiteral(hooks: ValidatorHooks | null, keys: ReadonlyArray<keyof Omit<ValidatorHooks, 'importedZodNames'>>): string | null {
  const entries = keys.flatMap((key) => (hooks?.[key] ? [`${key}: ${hooks[key]}`] : []))
  return entries.length ? `validator: { ${entries.join(', ')}, ...config.validator }` : null
}
