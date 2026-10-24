import type { GetPetByIdResponse, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../models/ts/pet/GetPetById'
import { http, HttpResponse } from 'msw/http'

export function getPetByIdHandlerResponse200(data: GetPetByIdResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getPetByIdHandlerResponse400(data?: GetPetByIdStatus400) {
  return new HttpResponse(JSON.stringify(data), {
    status: 400,
  })
}

export function getPetByIdHandlerResponse404(data?: GetPetByIdStatus404) {
  return new HttpResponse(JSON.stringify(data), {
    status: 404,
  })
}

export function getPetByIdHandler(
  data?: GetPetByIdResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
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
