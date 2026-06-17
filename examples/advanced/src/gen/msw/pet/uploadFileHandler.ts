import type { UploadFileResponse, UploadFileData } from '../../models/ts/pet/UploadFile.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function uploadFileHandlerResponse200(data: UploadFileResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function uploadFileHandler(data?: UploadFileResponse | HttpResponseResolver<Record<string, string>, UploadFileData, any>) {
  return http.post<Record<string, string>, UploadFileData, any>(`/pet/:petId/uploadImage`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
