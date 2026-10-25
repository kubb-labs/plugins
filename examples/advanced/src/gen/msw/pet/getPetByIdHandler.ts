import type { Pet } from '../../models/ts/Pet'
import { http, HttpResponse } from 'msw/http'

export function getPetByIdHandlerResponse200(data: Omit<NonNullable<Pet>, 'name'>) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getPetByIdHandlerResponse400(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 400,
  })
}

export function getPetByIdHandlerResponse404(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 404,
  })
}

export function getPetByIdHandler(
  data?: Omit<NonNullable<Pet>, 'name'> | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/pet/:petId\\:search`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
