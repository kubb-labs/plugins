import type { Pet } from '../../models/ts/Pet'
import { http, HttpResponse } from 'msw/http'

export function findPetsByTagsHandlerResponse200(data: Array<Pet> | string) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function findPetsByTagsHandlerResponse400(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 400,
  })
}

export function findPetsByTagsHandler(
  data?: (Array<Pet> | string) | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/pet/findByTags`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
