import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption } from '../types.ts'
import { buildResultType } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. With the default
 * `returnType: 'full'` the runtime call already resolves to `{ data, error, request, response }`,
 * so the generated code just forwards that result and casts it to the operation's `RequestResult`.
 * With `returnType: 'data'` it instead routes the call through the runtime's `unwrapResult`, which
 * narrows the resolved value down to the bare success body the same way the `RequestResult` type
 * already does, keeping the `throwOnError` default in one place instead of restating it per call.
 *
 * @example
 * `return request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>`
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
  const resultType = buildResultType({ node, types, returnType })
  if (returnType === 'data') {
    return `return unwrapResult(request(${callConfig}), config.throwOnError) as Promise<${resultType}>`
  }
  return `return request(${callConfig}) as Promise<${resultType}>`
}
