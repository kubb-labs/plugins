import type { HttpResponseResolver } from 'msw/http'
import type { DefaultBodyType } from 'msw'
import { http, HttpResponse } from 'msw/http'

export function createPetsHandlerResponse201(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
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
        {
          name: string
          tag: string
        } extends DefaultBodyType
          ? {
              name: string
              tag: string
            }
          : DefaultBodyType
      >,
  options?: { baseURL?: string },
) {
  return http.post<
    Record<string, string>,
    {
      name: string
      tag: string
    } extends DefaultBodyType
      ? {
          name: string
          tag: string
        }
      : DefaultBodyType
  >(`${options?.baseURL ?? ''}/pets/:uuid`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 201,
    })
  })
}
