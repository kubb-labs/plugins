import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'

/**
 * Builds the `RequestResult` generic arguments for one operation: the plugin-ts per-status responses
 * record plus the per-call `ThrowOnError` flag. `SuccessOf` / `ErrorOf` split the record inside the
 * runtime, so this only names the record and threads `ThrowOnError`.
 *
 * @example
 * `buildRequestResultGenerics({ node, tsResolver }) // 'AddPetResponses, ThrowOnError'`
 */
export function buildRequestResultGenerics({ node, tsResolver }: { node: ast.OperationNode; tsResolver: ResolverTs }): string {
  return `${tsResolver.response.responses(node)}, ThrowOnError`
}
