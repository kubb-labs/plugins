import type { ApiResponse } from '../../models/ts/ApiResponse'
import type { HttpResponseResolver } from 'msw/http'
import type { DefaultBodyType } from 'msw'
import { http, HttpResponse } from 'msw/http'

export function uploadFileHandlerResponse200(data: ApiResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function uploadFileHandler(
  data?: ApiResponse | HttpResponseResolver<Record<string, string>, Blob extends DefaultBodyType ? Blob : DefaultBodyType>,
  options?: { baseURL?: string },
) {
  return http.post<Record<string, string>, Blob extends DefaultBodyType ? Blob : DefaultBodyType>(
    `${options?.baseURL ?? ''}/pet/:petId/uploadImage`,
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
