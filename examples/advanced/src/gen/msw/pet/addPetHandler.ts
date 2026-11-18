import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'
import type { HttpResponseResolver } from 'msw/http'
import type { DefaultBodyType } from 'msw'
import { http, HttpResponse } from 'msw/http'

export function addPetHandlerResponse405(data?: { code?: number; message?: string }) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

type MswBody<T> = T extends DefaultBodyType ? T : DefaultBodyType

export function addPetHandler(
  data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, MswBody<AddPetRequest | Omit<NonNullable<Pet>, 'id'>>>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, MswBody<AddPetRequest | Omit<NonNullable<Pet>, 'id'>>>(`${options?.baseURL ?? ''}/pet`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(JSON.stringify(data), {
      status: 200,
    })
  })
}
