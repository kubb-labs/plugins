import type { StreamPetEventsResponse } from '../../models/ts/stream/StreamPetEvents.ts'
import { http } from 'msw'

export function streamPetEventsHandlerResponse200(data: StreamPetEventsResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
    },
  })
}

export function streamPetEventsHandler(
  data?: StreamPetEventsResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get(`/pet/:petId/events`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  })
}
