import type { Pet } from '../../models/ts/Pet'
import type { HttpResponseResolver } from 'msw/http'
import type { DefaultBodyType } from 'msw'
import { http, HttpResponse } from 'msw/http'

export function updatePetHandlerResponse200(
  data:
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      },
) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse202(
  data:
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      },
) {
  return new HttpResponse(JSON.stringify(data), {
    status: 202,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updatePetHandlerResponse400(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 400,
  })
}

export function updatePetHandlerResponse404(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 404,
  })
}

export function updatePetHandlerResponse405(data?: unknown) {
  return new HttpResponse(JSON.stringify(data), {
    status: 405,
  })
}

export function updatePetHandler(
  data?:
    | (
        | Omit<NonNullable<Pet>, 'name'>
        | {
            id?: number
          }
      )
    | HttpResponseResolver<Record<string, string>, Omit<NonNullable<Pet>, 'id'> extends DefaultBodyType ? Omit<NonNullable<Pet>, 'id'> : DefaultBodyType>,
  options?: { baseURL?: string },
) {
  return http.put<Record<string, string>, Omit<NonNullable<Pet>, 'id'> extends DefaultBodyType ? Omit<NonNullable<Pet>, 'id'> : DefaultBodyType>(
    `${options?.baseURL ?? ''}/pet`,
    function handler(info) {
      if (typeof data === 'function') return data(info)

      return new HttpResponse(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
  )
}
