/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UploadFileRequestConfig, UploadFilePathPetId, UploadFileData, UploadFileStatus200 } from './UploadFile'
import { client } from './.kubb/client'
import { buildFormData } from './.kubb/config'

export function getUploadFileUrl({ petId }: { petId: UploadFilePathPetId }) {
  const res = { method: 'POST', url: `/pet/${petId}/uploadImage` as const }

  return res
}

/**
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { path, body }: Omit<UploadFileRequestConfig, 'url'>,
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = body
  const formData = buildFormData(requestData)

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl(path).url.toString(),
    body: contentType === 'multipart/form-data' ? (formData as FormData) : requestData,
    contentType,
    ...requestConfig,
  })

  return res.data
}
