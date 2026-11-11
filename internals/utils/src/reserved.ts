import { code } from '@kubb/kit'

/**
 * Returns `name` when it's a syntactically valid JavaScript variable name,
 * otherwise prefixes it with `_` so the result is a valid identifier.
 *
 * Useful for sanitizing OpenAPI schema names or operation IDs that start with
 * a digit (e.g. `409`, `504AccountCancel`) before using them as exported
 * variable, type, or function names.
 *
 * @example
 * ```ts
 * ensureValidVarName('409')             // '_409'
 * ensureValidVarName('504AccountCancel') // '_504AccountCancel'
 * ensureValidVarName('Pet')              // 'Pet'
 * ensureValidVarName('class')            // '_class'
 * ```
 */
export function ensureValidVarName(name: string): string {
  if (!name || code.isIdentifier(name)) {
    return name
  }
  return `_${name}`
}
