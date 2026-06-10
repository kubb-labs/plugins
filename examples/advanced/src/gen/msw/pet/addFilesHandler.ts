import type { AddFilesResponse, AddFilesStatus405, AddFilesData } from '../../models/ts/pet/AddFiles.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function addFilesHandlerResponse200(data: AddFilesResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function addFilesHandlerResponse405(data?: AddFilesStatus405) {
  return new Response(JSON.stringify(data), {
    status: 405,
  })
}

export function addFilesHandler(data?: AddFilesResponse | HttpResponseResolver<Record<string, string>, AddFilesData, any>) {
  return http.post<Record<string, string>, AddFilesData, any>(`/pet/files`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
