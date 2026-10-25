import { http, HttpResponse } from 'msw/http'

export function deletePetHandlerResponse400(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 400,
  })
}

export function deletePetHandler(
  data?: string | number | boolean | null | object | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.delete(`${options?.baseURL ?? ''}/pet/:petId\\:search`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
    })
  })
}
