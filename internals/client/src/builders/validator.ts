import type { ast } from 'kubb/kit'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ValidatorOptions } from '../types.ts'
import { buildZodErrorParse, buildZodResponseParse, resolveRequestValidator, resolveResponseValidator } from './validatorOptions.ts'

/**
 * The per-call validator references a generated function wires into its request config. Each hook is
 * the bare schema reference passed to the runtime's `validator.request` / `validator.response` /
 * `validator.error` slot; `client.ts` runs it through `validateStandardSchema`. The response validator
 * only ever sees success (2xx) bodies.
 */
export type ValidatorHooks = {
  /**
   * Schema reference for the `validator.request` hook, or `null` when request validation is off.
   */
  request: string | null
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
 * Builds the validator-hook references for one operation. Request validation runs before the send;
 * response validation runs on the success body only. Returns `null` references when the matching
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
  const importedZodNames: Array<string> = []

  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const zodRequestName = zodResolver && resolveRequestValidator(validator) === 'zod' && hasRequestBody ? zodResolver.resolveDataName?.(node) : null
  const request = zodRequestName ?? null
  if (zodRequestName) importedZodNames.push(zodRequestName)

  const responseParse = zodResolver && resolveResponseValidator(validator) === 'zod' ? buildZodResponseParse(node, zodResolver) : null
  const response = responseParse ? responseParse.expression : null
  if (responseParse) importedZodNames.push(...responseParse.importNames)

  const errorParse = zodResolver && resolveResponseValidator(validator) === 'zod' ? buildZodErrorParse(node, zodResolver) : null
  const error = errorParse ? errorParse.expression : null
  if (errorParse) importedZodNames.push(...errorParse.importNames)

  return { request, response, error, importedZodNames }
}
