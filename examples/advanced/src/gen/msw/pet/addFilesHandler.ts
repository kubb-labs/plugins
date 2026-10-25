import type { AddFilesResponse, AddFilesStatus405, AddFilesBody } from '../../models/ts/pet/AddFiles'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

export function addFilesHandlerResponse200(data: AddFilesResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addFilesHandlerResponse405(data?: AddFilesStatus405) {
  return new HttpResponse(JSON.stringify(data), {
    status: 405,
  })
}

export function addFilesHandler(data?: AddFilesResponse | HttpResponseResolver<Record<string, string>, AddFilesBody>, options?: { baseURL?: string }) {
  return http.post<Record<string, string>, AddFilesBody>(`${options?.baseURL ?? ''}/pet/files`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
