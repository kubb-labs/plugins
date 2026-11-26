import type { MswBody } from '../../.kubb/mswBody'
import type { Pet } from '../../models/ts/Pet'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

type AddFilesStatus200 = Omit<NonNullable<Pet>, 'name'>

type AddFilesBody =
  | {
      url: string
    }
  | Omit<NonNullable<Pet>, 'id'>

export function addFilesHandlerResponse200(data?: AddFilesStatus200) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addFilesHandlerResponse405(data?: unknown) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 405,
  })
}

export function addFilesHandler(
  data?: AddFilesStatus200 | HttpResponseResolver<Record<string, string>, MswBody<AddFilesBody>>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, MswBody<AddFilesBody>>(`${options?.baseURL ?? ''}/pet/files`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return addFilesHandlerResponse200(data)
  })
}
