import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption } from '../types.ts'

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

/**
 * Builds the result type name an operation's function signature and return statement use:
 * `RequestResult` for the default `returnType: 'full'`, or the runtime's `UnwrappedResult` when
 * `returnType: 'data'` narrows a resolved call down to the bare success body.
 *
 * @example
 * `buildResultType({ node, types, returnType: 'data' }) // 'UnwrappedResult<AddPetResponses, ThrowOnError>'`
 */
export function buildResultType({ node, types, returnType }: { node: ast.OperationNode; types: OperationTypeNames; returnType: ReturnTypeOption }): string {
  const generics = buildRequestResultGenerics({ node, types })
  return returnType === 'data' ? `UnwrappedResult<${generics}>` : `RequestResult<${generics}>`
}
