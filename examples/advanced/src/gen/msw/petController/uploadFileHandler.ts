import type { UploadFileResponse, UploadFileData } from '../../models/ts/petController/UploadFile.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function uploadFileHandlerResponse200(data?: UploadFileResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
  })
}

export function uploadFileHandler(data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, UploadFileData, any>) {
  return http.post<Record<string, string>, UploadFileData, any>(`/pet/:petId/uploadImage`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
