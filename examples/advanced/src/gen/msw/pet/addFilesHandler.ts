import type { Pet } from '../../models/ts/Pet'
import type { HttpResponseResolver } from 'msw/http'
import type { DefaultBodyType } from 'msw'
import { http, HttpResponse } from 'msw/http'

export function addFilesHandlerResponse200(data: Omit<NonNullable<Pet>, 'name'>) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addFilesHandlerResponse405(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 405,
  })
}

export function addFilesHandler(
  data?:
    | Omit<NonNullable<Pet>, 'name'>
    | HttpResponseResolver<
        Record<string, string>,
          | {
              url: string
            }
          | Omit<NonNullable<Pet>, 'id'> extends DefaultBodyType
          ?
              | {
                  url: string
                }
              | Omit<NonNullable<Pet>, 'id'>
          : DefaultBodyType
      >,
  options?: { baseURL?: string },
) {
  return http.post<
    Record<string, string>,
      | {
          url: string
        }
      | Omit<NonNullable<Pet>, 'id'> extends DefaultBodyType
      ?
          | {
              url: string
            }
          | Omit<NonNullable<Pet>, 'id'>
      : DefaultBodyType
  >(`${options?.baseURL ?? ''}/pet/files`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
