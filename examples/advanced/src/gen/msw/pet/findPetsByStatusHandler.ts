import type { Pet } from '../../models/ts/Pet'
import { http, HttpResponse } from 'msw/http'

export function findPetsByStatusHandlerResponse200(data: Array<Pet>) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function findPetsByStatusHandlerResponse400(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 400,
  })
}

export function findPetsByStatusHandler(
  data?: Array<Pet> | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/pet/findByStatus/:step_id`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
