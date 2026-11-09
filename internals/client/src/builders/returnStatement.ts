import { getEventStream, hasRequestContentTypeChoice } from '@internals/shared'
import type { ast } from '@kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption } from '../types.ts'
import type { ValidatorHooks } from './validator.ts'
import { buildRequestResultGenerics, buildResultType } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. With the default
 * `returnType: 'full'` the runtime call already resolves to `{ data, error, request, response }`.
 * The generated code casts that result to the operation's `RequestResult`, then wraps it with
 * `withUnwrap`, so the caller can `await` it directly or call `.unwrap()` for the bare success
 * body. With `returnType: 'data'` it instead routes the call through the runtime's `unwrapResult`,
 * which narrows the resolved value down to the bare success body the same way `RequestResult`
 * already does, using the plugin default when the call leaves `throwOnError` unset.
 * With `returnType: 'plain'` it returns the runtime call as is, cast to `RequestResult`, with no helper.
 *
 * Cast first, wrap second, for the `'full'` path. That order keeps `withUnwrap`'s generic inferred
 * as `RequestResult` instead of the runtime's own internal result type. Casting an `Unwrappable<A>`
 * straight to `Unwrappable<B>` does not work: the `.then` overload stays pinned to `A`, and `as`
 * rejects that two-generic swap even where `A` and `B` on their own would satisfy it.
 *
 * @example
 * `return withUnwrap(request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>)`
 * @example
 * `return unwrapResult(request({ method: 'POST', url: '/pet', ...config }), config.throwOnError ?? false) as Promise<UnwrappedResult<AddPetResponses, ThrowOnError>>`
 * @example
 * `return request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>`
 */
export function buildReturnStatement({
  node,
  types,
  callConfig,
  returnType,
  throwOnErrorDefault,
}: {
  node: ast.OperationNode
  types: OperationTypeNames
  callConfig: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}): string {
  // The options of a body offered in several media types are a union, so the body type cannot be inferred from `config`.
  // A `'plain'` client is the caller's own function, which takes no type argument.
  const request = returnType !== 'plain' && hasRequestContentTypeChoice(node) ? `request<${types.response.options(node)}['body']>` : 'request'
  if (returnType === 'data') {
    const resultType = buildResultType({ node, types, returnType })
    return `return unwrapResult(${request}(${callConfig}), config.throwOnError ?? ${throwOnErrorDefault}) as ${resultType}`
  }
  if (returnType === 'plain') {
    return `return ${request}(${callConfig}) as Promise<RequestResult<${buildRequestResultGenerics({ node, types })}>>`
  }
  return `return withUnwrap(${request}(${callConfig}) as Promise<RequestResult<${buildRequestResultGenerics({ node, types })}>>)`
}

/**
 * Builds the return type and statement of a streamed operation. The item type is `TypedEvent<...>` when each event declares
 * its own `event` and `data`, the success type itself for JSON Lines, and otherwise the payload type, which `EventStreamResult`
 * wraps in `ServerSentEvent`. The call's promise goes through `toEventStream` with the `client` for its defaults, the call's
 * `config`, the shape and the per-item validator. A `returnType: 'plain'` client receives only the promise,
 * `toEventStream(request(config))`, plus the shape for JSON Lines, and keeps its response validator in the call config.
 */
export function buildEventStreamReturn({
  node,
  types,
  callConfig,
  returnType,
  validatorHooks,
  throwOnErrorDefault,
}: {
  node: ast.HttpOperationNode
  types: OperationTypeNames
  callConfig: string
  returnType: ReturnTypeOption
  validatorHooks: ValidatorHooks | null
  throwOnErrorDefault: boolean
}): {
  returnType: string
  statement: string
} {
  const shape = getEventStream(node) ?? 'data'
  const responses = types.response.responses(node)
  const success = `SuccessOf<${responses}>`
  const eventType = { event: `TypedEvent<${success}>`, data: `ServerSentEvent<${success}>`, line: success }[shape]
  if (returnType === 'plain') {
    const options = shape === 'line' ? `, { shape: 'line' }` : ''
    return { returnType: `Promise<EventStreamResult<${eventType}>>`, statement: `return toEventStream<${eventType}>(request(${callConfig})${options})` }
  }

  const generics = `${responses}, ThrowOnError${shape === 'data' ? '' : `, ${eventType}`}`
  const meta = [`shape: '${shape}'`, validatorHooks?.response ? `validator: ${validatorHooks.response}` : null].filter(Boolean).join(', ')
  const call = `toEventStream<${eventType}>(request(${callConfig}), { client: request, config, ${meta} })`
  if (returnType === 'data') {
    const result = `Promise<UnwrappedStreamResult<${generics}>>`
    return { returnType: result, statement: `return unwrapResult(${call}, config.throwOnError ?? ${throwOnErrorDefault}) as ${result}` }
  }
  return { returnType: `Unwrappable<StreamResult<${generics}>>`, statement: `return withUnwrap(${call} as Promise<StreamResult<${generics}>>)` }
}

/**
 * The stream types an operation file imports: the result and options types for `returnType`, `TypedEvent` for named
 * events, and `ServerSentEvent` for a payload-only stream.
 */
export function buildEventStreamImports({ returnType, typed, payload }: { returnType: ReturnTypeOption; typed: boolean; payload: boolean }): Array<string> {
  const result = { plain: ['EventStreamResult'], full: ['StreamResult', 'StreamOptions'], data: ['UnwrappedStreamResult', 'StreamOptions'] }[returnType]
  return [...result, ...(typed ? ['TypedEvent'] : []), ...(payload ? ['ServerSentEvent'] : [])]
}
