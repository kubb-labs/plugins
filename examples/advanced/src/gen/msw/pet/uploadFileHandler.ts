import type { UploadFileResponse, UploadFileBody } from '../../models/ts/pet/UploadFile'
import type { HttpResponseResolver } from 'msw/http'
import { http, HttpResponse } from 'msw/http'

export function uploadFileHandlerResponse200(data: UploadFileResponse) {
  return new HttpResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function uploadFileHandler(data?: UploadFileResponse | HttpResponseResolver<Record<string, string>, UploadFileBody>, options?: { baseURL?: string }) {
  return http.post<Record<string, string>, UploadFileBody>(`${options?.baseURL ?? ''}/pet/:petId/uploadImage`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new HttpResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
