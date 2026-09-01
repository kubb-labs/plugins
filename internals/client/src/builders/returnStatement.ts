import type { ast } from 'kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption } from '../types.ts'
import { buildResultType } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. With the default
 * `returnType: 'full'` the runtime call already resolves to `{ data, error, request, response }`,
 * so the generated code just forwards that result and casts it to the operation's `RequestResult`.
 * With `returnType: 'data'` it also narrows the resolved value down to the bare success body,
 * matching `config.throwOnError` (on by default) the same way the `RequestResult` type already does.
 *
 * @example
 * `return request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>`
 * @example
 * `return request({ method: 'POST', url: '/pet', ...config }).then((result) => (config.throwOnError ?? true ? result.data : result)) as Promise<UnwrappedResult<AddPetResponses, ThrowOnError>>`
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
    return `return request(${callConfig}).then((result) => (config.throwOnError ?? true ? result.data : result)) as Promise<${resultType}>`
  }
  return `return request(${callConfig}) as Promise<${resultType}>`
}
