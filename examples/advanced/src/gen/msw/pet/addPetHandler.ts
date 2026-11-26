import type { MswBody } from '../../.kubb/mswBody'
import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

type AddPetBody = AddPetRequest | Omit<NonNullable<Pet>, 'id'>

export function addPetHandlerResponse405(data?: { code?: number; message?: string }) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addPetHandler(
  data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, MswBody<AddPetBody>>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, MswBody<AddPetBody>>(`${options?.baseURL ?? ''}/pet`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(JSON.stringify(data), {
      status: 200,
    })
  })
}
