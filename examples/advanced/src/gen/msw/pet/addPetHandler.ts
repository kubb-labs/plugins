import type { AddPetStatus405, AddPetBody } from '../../models/ts/pet/AddPet'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

export function addPetHandlerResponse405(data: AddPetStatus405) {
  return new HttpResponse(JSON.stringify(data), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addPetHandler(
  data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, AddPetBody>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, AddPetBody>(`${options?.baseURL ?? ''}/pet`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
    })
  })
}
