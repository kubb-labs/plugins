import type { MswBody } from '../../.kubb/mswBody'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

export function createPetsHandlerResponse201(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 201,
  })
}

export function createPetsHandler(
  data?:
    | string
    | number
    | boolean
    | null
    | object
    | HttpResponseResolver<
        Record<string, string>,
        MswBody<{
          name: string
          tag: string
        }>
      >,
  options?: { baseURL?: string },
) {
  return http.post<
    Record<string, string>,
    MswBody<{
      name: string
      tag: string
    }>
  >(`${options?.baseURL ?? ''}/pets/:uuid`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse<string>(JSON.stringify(data), {
      status: 201,
    })
  })
}
