import type { OrderEvent } from '../../models/ts/OrderEvent'
import { http, HttpResponse } from 'msw/http'

export function streamOrderEventsHandlerResponse200(data: OrderEvent) {
  const event = data as { event?: unknown; id?: unknown; retry?: unknown; data?: unknown } | undefined
  const payload =
    typeof event?.data === 'string'
      ? event.data
      : event?.data === undefined
        ? undefined
        : JSON.stringify(event.data, (_key, value) => (typeof value === 'bigint' ? Number(value) : value))
  const lines = [
    ...(['event', 'id', 'retry'] as const).filter((field) => event?.[field] !== undefined).map((field) => `${field}: ${event?.[field]}`),
    ...(payload?.split('\n').map((line) => `data: ${line}`) ?? []),
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

    const event = data as { event?: unknown; id?: unknown; retry?: unknown; data?: unknown } | undefined
    const payload =
      typeof event?.data === 'string'
        ? event.data
        : event?.data === undefined
          ? undefined
          : JSON.stringify(event.data, (_key, value) => (typeof value === 'bigint' ? Number(value) : value))
    const lines = [
      ...(['event', 'id', 'retry'] as const).filter((field) => event?.[field] !== undefined).map((field) => `${field}: ${event?.[field]}`),
      ...(payload?.split('\n').map((line) => `data: ${line}`) ?? []),
    ]

    return new HttpResponse<string>(event === undefined ? '' : `${lines.join('\n')}\n\n`, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  })
}
