/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UploadFileRequestConfig, UploadFileData, UploadFileStatus200 } from './UploadFile'
import { client } from './.kubb/client'
import { buildFormData } from './.kubb/config'

export function getUploadFileUrl(path: UploadFileRequestConfig['path']) {
  const res = { method: 'POST', url: `/pet/${path.petId}/uploadImage` as const }

  return res
}

/**
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { path, body }: UploadFileRequestConfig,
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestBody = body
  const formData = buildFormData(requestBody)

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl(path).url.toString(),
    body: contentType === 'multipart/form-data' ? (formData as FormData) : requestBody,
    contentType,
    ...requestConfig,
  })

  return res.data
}
