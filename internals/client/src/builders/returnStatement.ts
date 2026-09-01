import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import { buildRequestResultGenerics } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. The runtime call already resolves
 * to `{ data, error, request, response }`; the generated code casts that result to the operation's
 * `RequestResult` first (as it always did), then wraps it with `withUnwrap` so the caller can
 * `await` it directly or call `.unwrap()` for the bare success body.
 *
 * Casting the raw call and only then wrapping keeps `withUnwrap`'s generic inferred as
 * `RequestResult`, not the runtime's own internal result type: an `Unwrappable<A>` cast straight to
 * `Unwrappable<B>` carries a `.then` overload pinned to `A`, and that two-generic swap is too narrow
 * for `as` to allow, even where `A` and `B` alone would satisfy it.
 *
 * @example
 * `return withUnwrap(request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>)`
 */
export function buildReturnStatement({ node, types, callConfig }: { node: ast.OperationNode; types: OperationTypeNames; callConfig: string }): string {
  return `return withUnwrap(request(${callConfig}) as Promise<RequestResult<${buildRequestResultGenerics({ node, types })}>>)`
}
