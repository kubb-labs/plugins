import { ast } from '@internals/ast'
import { text } from '@kubb/kit'
import type { PluginValibot, ResolverValibot } from '@kubb/plugin-valibot'
import type { PluginZod, ResolverZod } from '@kubb/plugin-zod'
import type { ValidatorLibrary, ValidatorOptions } from '../types.ts'

// Literals, not imports: both schema plugins are optional peers, so `dist` must not load them at runtime.
export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']
export const pluginValibotName = 'plugin-valibot' satisfies PluginValibot['name']

/**
 * The resolver of the plugin that generates the schemas a validator reads.
 */
export type ValidatorResolver = ResolverZod | ResolverValibot

/**
 * Returns the library the validator uses, or `null` when no direction is on.
 */
export function resolveValidatorLibrary(validator: ValidatorOptions | undefined): ValidatorLibrary | null {
  if (!validator) return null
  if (typeof validator === 'string') return validator

  return validator.request ?? validator.params ?? validator.response ?? null
}

/**
 * Whether request body parsing is on. The string shorthand validates the response only.
 */
export function resolveRequestValidator(validator: ValidatorOptions | undefined): boolean {
  return typeof validator === 'object' && Boolean(validator.request)
}

/**
 * Whether path, query, header, and cookie params parsing is on. Only the object form enables it.
 */
export function resolveParamsValidator(validator: ValidatorOptions | undefined): boolean {
  return typeof validator === 'object' && Boolean(validator.params)
}

/**
 * Whether response parsing is on. The string shorthand maps to response parsing.
 */
export function resolveResponseValidator(validator: ValidatorOptions | undefined): boolean {
  return typeof validator === 'string' || (typeof validator === 'object' && Boolean(validator.response))
}

/**
 * Builds the `validator.error` map of a call, one `<operation>StatusNNNSchema` per non-2xx response with a
 * schema, such as `{ 404: getPetStatus404Schema, '5xx': getPetStatus5xxSchema }`. Returns `null` without one.
 */
export function buildErrorParse(node: ast.OperationNode, schemaResolver: ValidatorResolver): { literal: string; names: Array<string> } | null {
  const entries = node.responses
    .filter((res) => !ast.http.status.isSuccess(res) && res.content?.some((entry) => entry.schema))
    .map((res) => ({ key: String(res.statusCode), name: schemaResolver.response.status(node, res.statusCode) }))
  if (!entries.length) return null
  const literal = entries.map(({ key, name }) => `${/^\d+$/.test(key) ? key : text.quote(key)}: ${name}`).join(', ')
  return { literal: `{ ${literal} }`, names: entries.map(({ name }) => name) }
}
