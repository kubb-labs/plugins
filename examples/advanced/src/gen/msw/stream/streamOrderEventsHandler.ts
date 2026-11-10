import type { OrderEvent } from '../../models/ts/OrderEvent'
import { http, HttpResponse } from 'msw/http'

export function streamOrderEventsHandlerResponse200(data: OrderEvent) {
  return new HttpResponse<string>(
    data === undefined ? '' : `data: ${JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? Number(value) : value))}\n\n`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    },
  )
}

export function streamOrderEventsHandler(
  data?: OrderEvent | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/store/order/:orderId/events`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(
      data === undefined ? '' : `data: ${JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? Number(value) : value))}\n\n`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      },
    )
  })
}
