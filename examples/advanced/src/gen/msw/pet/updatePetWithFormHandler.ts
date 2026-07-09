import type { UpdatePetWithFormStatus405 } from '../../models/ts/pet/UpdatePetWithForm'
import { http } from 'msw'

export function updatePetWithFormHandlerResponse405(data: UpdatePetWithFormStatus405) {
  return new Response(JSON.stringify(data), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetWithFormHandler(
  data?: string | number | boolean | null | object | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>),
) {
  return http.post(`/pet/:petId\\:search`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
