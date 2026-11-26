import type { StreamOptions, Unwrappable, StreamResult, SuccessOf, TypedEvent } from '../../../.kubb/client'
import type { OrderEvent } from '../../../models/ts/OrderEvent'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'

type StreamOrderEventsResponses = {
  '200': OrderEvent
}

/**
 * `GET /store/order/{orderId}/events`
 * @description Server-Sent Events stream of an order, one event per step. Each event names itself with `event` and carries the order in `data`.
 * @summary Stream order updates
 */
export function streamOrderEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<
    {
      body?: never
      path: {
        orderId: number
      }
      query?: never
      headers?: never
    },
    ThrowOnError
  >,
): Unwrappable<StreamResult<StreamOrderEventsResponses, ThrowOnError, TypedEvent<SuccessOf<StreamOrderEventsResponses>>>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient.stream<StreamOrderEventsResponses, ThrowOnError, TypedEvent<SuccessOf<StreamOrderEventsResponses>>>({
      method: 'GET',
      url: '/store/order/{orderId}/events',
      contentType: { response: 'text/event-stream' },
      eventShape: 'event',
      rawData: ['ping'],
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
