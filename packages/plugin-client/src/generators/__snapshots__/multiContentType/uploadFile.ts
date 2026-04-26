/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/fetch'
import type { UploadFilePathPetId, UploadFileData, UploadFileResponse } from './UploadFile'
import { buildFormData } from './.kubb/config'
import { fetch } from './.kubb/fetch'

export function getUploadFileUrl(petId: UploadFilePathPetId) {
  const res = { method: 'POST', url: `/pet/${petId}/uploadImage` as const }

  return res
}

/**
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  petId: UploadFilePathPetId,
  data?: UploadFileData,
  contentType: 'application/json' | 'multipart/form-data' = 'application/json',
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const formData = buildFormData(requestData)

  const res = await request<UploadFileResponse, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl(petId).url.toString(),
    data: contentType === 'multipart/form-data' ? (formData as FormData) : requestData,
    ...requestConfig,
  })

  return res.data
}
