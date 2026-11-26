import type { MswBody } from '../../.kubb/mswBody'
import type { Pet } from '../../models/ts/Pet'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

type UpdatePetResponse =
  | (Omit<NonNullable<Pet>, 'name'> | string)
  | {
      id?: number
    }

type UpdatePetBodyJson = Omit<NonNullable<Pet>, 'id'>

export function updatePetHandlerResponse200(data?: UpdatePetResponse) {
  if (typeof data === 'string')
    return new HttpResponse<string>(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    })

  return new HttpResponse<string>(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse202(data?: UpdatePetResponse) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 202,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse400(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 400,
  })
}

export function updatePetHandlerResponse404(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 404,
  })
}

export function updatePetHandlerResponse405(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 405,
  })
}

export function updatePetHandler(
  data?: UpdatePetResponse | HttpResponseResolver<Record<string, string>, MswBody<UpdatePetBodyJson>>,
  options?: { baseURL?: string },
) {
  return http.put<Record<string, string>, MswBody<UpdatePetBodyJson>>(`${options?.baseURL ?? ''}/pet`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return updatePetHandlerResponse200(data)
  })
}
