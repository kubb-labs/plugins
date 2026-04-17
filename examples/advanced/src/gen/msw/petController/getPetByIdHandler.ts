import type { GetPetByIdResponse, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../models/ts/petController/GetPetById.ts'
import { http } from 'msw'

export function getPetByIdHandlerResponse200(data: GetPetByIdResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getPetByIdHandlerResponse400(data?: GetPetByIdStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function getPetByIdHandlerResponse404(data?: GetPetByIdStatus404) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function getPetByIdHandler(data?: GetPetByIdResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>)) {
  return http.get('/pet/:petId\\\\:search', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
