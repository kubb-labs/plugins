import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption } from '../types.ts'
import { buildRequestResultGenerics, buildResultType } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. With the default
 * `returnType: 'full'` the runtime call already resolves to `{ data, error, request, response }`.
 * The generated code casts that result to the operation's `RequestResult`, then wraps it with
 * `withUnwrap`, so the caller can `await` it directly or call `.unwrap()` for the bare success
 * body. With `returnType: 'data'` it instead routes the call through the runtime's `unwrapResult`,
 * which narrows the resolved value down to the bare success body the same way `RequestResult`
 * already does, keeping the `throwOnError` default in one place instead of restating it per call.
 *
 * Cast first, wrap second, for the `'full'` path. That order keeps `withUnwrap`'s generic inferred
 * as `RequestResult` instead of the runtime's own internal result type. Casting an `Unwrappable<A>`
 * straight to `Unwrappable<B>` does not work: the `.then` overload stays pinned to `A`, and `as`
 * rejects that two-generic swap even where `A` and `B` on their own would satisfy it.
 *
 * @example
 * `return withUnwrap(request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>)`
 * @example
 * `return unwrapResult(request({ method: 'POST', url: '/pet', ...config }), config.throwOnError) as Promise<UnwrappedResult<AddPetResponses, ThrowOnError>>`
 */
export function buildReturnStatement({
  node,
  types,
  callConfig,
  returnType,
}: {
  node: ast.OperationNode
  types: OperationTypeNames
  callConfig: string
  returnType: ReturnTypeOption
}): string {
  if (returnType === 'data') {
    const resultType = buildResultType({ node, types, returnType })
    return `return unwrapResult(request(${callConfig}), config.throwOnError) as ${resultType}`
  }
  return `return withUnwrap(request(${callConfig}) as Promise<RequestResult<${buildRequestResultGenerics({ node, types })}>>)`
}
