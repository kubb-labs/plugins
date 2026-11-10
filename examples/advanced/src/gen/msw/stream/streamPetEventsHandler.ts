import type { PetEvent } from '../../models/ts/PetEvent'
import { http, HttpResponse } from 'msw/http'

export function streamPetEventsHandlerResponse200(data: PetEvent) {
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

export function streamPetEventsHandler(
  data?: PetEvent | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/pet/:petId/events`, function handler(info) {
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
