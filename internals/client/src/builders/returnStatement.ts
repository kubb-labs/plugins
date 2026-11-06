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
 * Builds the return type and statement of a `text/event-stream` operation. The item type is `TypedEvent<...>` when each item
 * declares its own `event` and `data`, and otherwise the payload type, which `EventStreamResult` wraps in `ServerSentEvent`. The call's
 * promise goes through `toEventStream` with the `client` for its defaults, the call's `config`, the shape and the per-event
 * validator. A `returnType: 'plain'` client receives only the promise,
 * `toEventStream(request(config))`, and keeps its response validator in the call config.
 */
export function buildEventStreamReturn({
  node,
  types,
  callConfig,
  returnType,
  validatorHooks,
}: {
  node: ast.HttpOperationNode
  types: OperationTypeNames
  callConfig: string
  returnType: ReturnTypeOption
  validatorHooks: ValidatorHooks | null
}): {
  returnType: string
  statement: string
} {
  const shape = getEventStream(node) ?? 'data'
  const success = `SuccessOf<${types.response.responses(node)}>`
  const eventType = shape === 'event' ? `TypedEvent<${success}>` : success
  const promise = `Promise<EventStreamResult<${eventType}>>`
  if (returnType === 'plain') return { returnType: promise, statement: `return toEventStream<${eventType}>(request(${callConfig}))` }

  const meta = [`shape: '${shape}'`, validatorHooks?.response ? `validator: ${validatorHooks.response}` : null].filter(Boolean).join(', ')
  return { returnType: promise, statement: `return toEventStream<${eventType}>(request(${callConfig}), { client: request, config, ${meta} })` }
}

/**
 * The stream types a file with `text/event-stream` operations imports from `.kubb/sse.ts`, or from the custom client
 * module: the result, the per-call options unless the client is a plain custom module, and `TypedEvent` when an operation
 * types its events by name.
 */
export function buildEventStreamImports({ returnType, typed }: { returnType: ReturnTypeOption; typed: boolean }): Array<string> {
  return ['EventStreamResult', ...(returnType !== 'plain' ? ['EventStreamOptions'] : []), ...(typed ? ['TypedEvent'] : [])]
}
