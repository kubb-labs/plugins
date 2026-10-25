import { http, HttpResponse } from 'msw/http'

export function updatePetWithFormHandlerResponse405(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 405,
  })
}

export function updatePetWithFormHandler(
  data?: string | number | boolean | null | object | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.post(`${options?.baseURL ?? ''}/pet/:petId\\:search`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
    })
  })
}
