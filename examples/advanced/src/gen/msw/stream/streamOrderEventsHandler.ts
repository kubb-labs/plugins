import type { OrderEvent } from '../../models/ts/OrderEvent'
import { http, HttpResponse } from 'msw/http'

export function streamOrderEventsHandlerResponse200(data?: OrderEvent) {
  const event = data as { event?: unknown; id?: unknown; retry?: unknown; data?: unknown } | undefined
  const lines = [
    ...(['event', 'id', 'retry'] as const).filter((field) => event?.[field] !== undefined).map((field) => `${field}: ${event?.[field]}`),
    ...(event?.data === undefined
      ? []
      : [
          (typeof event.data === 'string' ? event.data : JSON.stringify(event.data))
            .split('\n')
            .map((line) => `data: ${line}`)
            .join('\n'),
        ]),
  ]

  return new HttpResponse<string>(event === undefined ? '' : `${lines.join('\n')}\n\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
    },
  })
}

export function streamOrderEventsHandler(
  data?: OrderEvent | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/store/order/:orderId/events`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return streamOrderEventsHandlerResponse200(data)
  })
}
