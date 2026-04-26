import type { CreatePetsResponse, CreatePetsData } from '../../models/ts/petsController/CreatePets.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function createPetsHandlerResponse201(data?: CreatePetsResponse) {
  return new Response(JSON.stringify(data), {
    status: 201,
  })
}

export function createPetsHandler(data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, CreatePetsData, any>) {
  return http.post<Record<string, string>, CreatePetsData, any>(`/pets/:uuid`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 201,
    })
  })
}
