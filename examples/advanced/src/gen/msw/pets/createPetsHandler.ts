import type { CreatePetsResponse, CreatePetsBody } from '../../models/ts/pets/CreatePets'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function createPetsHandlerResponse201(data: CreatePetsResponse) {
  return new Response(JSON.stringify(data), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function createPetsHandler(data?: CreatePetsResponse | HttpResponseResolver<Record<string, string>, CreatePetsBody>) {
  return http.post<Record<string, string>, CreatePetsBody>(`/pets/:uuid`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
