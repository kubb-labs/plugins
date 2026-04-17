import { http } from 'msw'
import type { FindPetsByTagsResponse, FindPetsByTagsStatus400 } from '../../models/ts/petController/FindPetsByTags.ts'

export function findPetsByTagsHandlerResponse200(data: FindPetsByTagsResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function findPetsByTagsHandlerResponse400(data?: FindPetsByTagsStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function findPetsByTagsHandler(data?: FindPetsByTagsResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>)) {
  return http.get('/pet/findByTags', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
