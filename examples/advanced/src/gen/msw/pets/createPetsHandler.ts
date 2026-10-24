import type { CreatePetsResponse, CreatePetsBody } from '../../models/ts/pets/CreatePets'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

export function createPetsHandlerResponse201(data?: CreatePetsResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 201,
  })
}

export function createPetsHandler(
  data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, CreatePetsBody>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, CreatePetsBody>(`${options?.baseURL ?? ''}/pets/:uuid`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 201,
    })
  })
}
