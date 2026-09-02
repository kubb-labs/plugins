import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import { buildRequestResultGenerics } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. The runtime call already resolves
 * to `{ data, error, request, response }`. The generated code casts that result to the operation's
 * `RequestResult`, then wraps it with `withUnwrap`, so the caller can `await` it directly or call
 * `.unwrap()` for the bare success body.
 *
 * Cast first, wrap second. That order keeps `withUnwrap`'s generic inferred as `RequestResult`
 * instead of the runtime's own internal result type. Casting an `Unwrappable<A>` straight to
 * `Unwrappable<B>` does not work: the `.then` overload stays pinned to `A`, and `as` rejects that
 * two-generic swap even where `A` and `B` on their own would satisfy it.
 *
 * @example
 * `return withUnwrap(request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>)`
 */
export function buildReturnStatement({ node, types, callConfig }: { node: ast.OperationNode; types: OperationTypeNames; callConfig: string }): string {
  return `return withUnwrap(request(${callConfig}) as Promise<RequestResult<${buildRequestResultGenerics({ node, types })}>>)`
}
