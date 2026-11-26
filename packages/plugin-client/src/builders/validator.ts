import { ast } from '@internals/ast'
import type { ValidatorOptions } from '../types.ts'
import {
  buildErrorParse,
  resolveParamsValidator,
  resolveRequestValidator,
  resolveResponseValidator,
  resolveValidatorLibrary,
  type ValidatorResolver,
} from './validatorOptions.ts'

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
   * Schema names the generated file imports from the output of the schema plugin.
   */
  importedSchemaNames: Array<string>
}

export type BuildValidatorHooksOptions = {
  node: ast.OperationNode
  validator: ValidatorOptions | undefined
  schemaResolver: ValidatorResolver | null | undefined
}

/**
 * Builds the validator-hook references for one operation. Request body and params validation run before the send.
 * Response validation runs on the success body only. Returns `null` references when the matching
 * direction is disabled or the schema is absent.
 */
export function buildValidatorHooks({ node, validator, schemaResolver }: BuildValidatorHooksOptions): ValidatorHooks {
  const hasRequestBody = Boolean(ast.http.requestBody.getSchema(node))
  const parsesResponse = schemaResolver && resolveResponseValidator(validator)

  // Success responses validate with the success-only `<operation>ResponseSchema`; error bodies with the schema of their status.
  // The schema plugins emit that schema only for an operation with a response body schema.
  const hasResponseSchema = node.responses.some((res) => res.content?.some((entry) => entry.schema))
  const response = parsesResponse && hasResponseSchema ? schemaResolver.response.response(node) || null : null
  const errorParse = parsesResponse ? buildErrorParse(node, schemaResolver) : null
  const request = schemaResolver && resolveRequestValidator(validator) && hasRequestBody ? schemaResolver.response.body(node) || null : null

  const paramGroups = ast.http.groupParameters(node)
  const resolveParamsName = (kind: 'path' | 'query' | 'headers' | 'cookies', params: Array<ast.ParameterNode>): string | null =>
    schemaResolver && resolveParamsValidator(validator) && params.length > 0 ? schemaResolver.param[kind](node, params[0]!) : null
  const path = resolveParamsName('path', paramGroups.path)
  const query = resolveParamsName('query', paramGroups.query)
  const headers = resolveParamsName('headers', paramGroups.header)
  const cookies = resolveParamsName('cookies', paramGroups.cookie)

  // Order is output: the generated file imports the response schema, then the error schemas, then the request body and params schemas.
  const importedSchemaNames = [response, ...(errorParse?.names ?? []), request, path, query, headers, cookies].filter((name): name is string => Boolean(name))

  // The declared keys of an object schema: `.shape` in Zod, `.entries` in Valibot.
  const keys = resolveValidatorLibrary(validator) === 'valibot' ? 'entries' : 'shape'
  const headersValidator = headers ? `toHeadersStandardSchema(${headers}, ${headers}.${keys})` : null

  return { request, path, query, headers: headersValidator, cookies, response, error: errorParse?.literal ?? null, importedSchemaNames }
}

/**
 * Prints the `validator: { … }` entry of a call config from the hooks named in `keys`, or `null` when none is set.
 * The entry spreads `config.validator` last, so a per-call hook overrides the generated one for its key only.
 */
export function buildValidatorLiteral(hooks: ValidatorHooks | null, keys: ReadonlyArray<keyof Omit<ValidatorHooks, 'importedSchemaNames'>>): string | null {
  const entries = keys.flatMap((key) => (hooks?.[key] ? [`${key}: ${hooks[key]}`] : []))
  return entries.length ? `validator: { ${entries.join(', ')}, ...config.validator }` : null
}
