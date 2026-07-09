import type { UpdatePetResponse, UpdatePetStatus400, UpdatePetStatus404, UpdatePetStatus405, UpdatePetBody } from '../../models/ts/pet/UpdatePet'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function updatePetHandlerResponse200(data: UpdatePetResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse202(data: UpdatePetResponse) {
  return new Response(JSON.stringify(data), {
    status: 202,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse400(data: UpdatePetStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse404(data: UpdatePetStatus404) {
  return new Response(JSON.stringify(data), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse405(data: UpdatePetStatus405) {
  return new Response(JSON.stringify(data), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandler(data?: UpdatePetResponse | HttpResponseResolver<Record<string, string>, UpdatePetBody>) {
  return http.put<Record<string, string>, UpdatePetBody>(`/pet`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
