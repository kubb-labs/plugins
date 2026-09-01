import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import { buildResultType } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. The runtime call already resolves
 * to `{ data, error, request, response }`; the generated code wraps that promise with `withUnwrap`
 * so the caller can `await` it directly or call `.unwrap()` for the bare success body, then casts
 * the result to the operation's `Unwrappable<RequestResult<...>>`.
 *
 * @example
 * `return withUnwrap(request({ method: 'POST', url: '/pet', ...config })) as Unwrappable<RequestResult<AddPetResponses, ThrowOnError>>`
 */
export function buildReturnStatement({ node, types, callConfig }: { node: ast.OperationNode; types: OperationTypeNames; callConfig: string }): string {
  return `return withUnwrap(request(${callConfig})) as ${buildResultType({ node, types })}`
}
