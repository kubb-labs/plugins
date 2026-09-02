import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'

/**
 * Builds the `RequestResult` generic arguments for one operation: the per-status responses record
 * plus the per-call `ThrowOnError` flag. `SuccessOf` / `ErrorOf` split the record inside the
 * runtime, so this only names the record and threads `ThrowOnError`.
 *
 * @example
 * `buildRequestResultGenerics({ node, types }) // 'AddPetResponses, ThrowOnError'`
 */
export function buildRequestResultGenerics({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string {
  return `${types.response.responses(node)}, ThrowOnError`
}
