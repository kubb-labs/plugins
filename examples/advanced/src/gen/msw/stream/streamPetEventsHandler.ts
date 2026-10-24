import type { StreamPetEventsResponse } from '../../models/ts/stream/StreamPetEvents'
import { http, HttpResponse } from 'msw/http'

export function streamPetEventsHandlerResponse200(data: StreamPetEventsResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
    },
  })
}

export function streamPetEventsHandler(
  data?: StreamPetEventsResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/pet/:petId/events`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  })
}
