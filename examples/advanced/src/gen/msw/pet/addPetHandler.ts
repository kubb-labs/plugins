import type { AddPetData, AddPetStatus405 } from '../../models/ts/pet/AddPet.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function addPetHandlerResponse405(data: AddPetStatus405) {
  return new Response(JSON.stringify(data), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addPetHandler(data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, AddPetData, any>) {
  return http.post<Record<string, string>, AddPetData, any>(`/pet`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
