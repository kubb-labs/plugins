import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { buildRequestResultGenerics } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. The runtime call already resolves
 * to `{ data, error, request, response }`; the generated code forwards that result and casts it to
 * the operation's `RequestResult`, which carries the `throwOnError` discrimination.
 *
 * @example
 * `return request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>`
 */
export function buildReturnStatement({ node, tsResolver, callConfig }: { node: ast.OperationNode; tsResolver: ResolverTs; callConfig: string }): string {
  return `return request(${callConfig}) as Promise<RequestResult<${buildRequestResultGenerics({ node, tsResolver })}>>`
}
