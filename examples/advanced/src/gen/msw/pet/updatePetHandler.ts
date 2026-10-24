import type { UpdatePetResponse, UpdatePetStatus400, UpdatePetStatus404, UpdatePetStatus405, UpdatePetBody } from '../../models/ts/pet/UpdatePet'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

export function updatePetHandlerResponse200(data: UpdatePetResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse202(data: UpdatePetResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 202,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse400(data?: UpdatePetStatus400) {
  return new HttpResponse(JSON.stringify(data), {
    status: 400,
  })
}

export function updatePetHandlerResponse404(data?: UpdatePetStatus404) {
  return new HttpResponse(JSON.stringify(data), {
    status: 404,
  })
}

export function updatePetHandlerResponse405(data?: UpdatePetStatus405) {
  return new HttpResponse(JSON.stringify(data), {
    status: 405,
  })
}

export function updatePetHandler(data?: UpdatePetResponse | HttpResponseResolver<Record<string, string>, UpdatePetBody>, options?: { baseURL?: string }) {
  return http.put<Record<string, string>, UpdatePetBody>(`${options?.baseURL ?? ''}/pet`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
