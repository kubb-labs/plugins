/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UploadFilePathPetId, UploadFileData, UploadFileResponse } from './UploadFile'
import { fetch } from './.kubb/client'
import { buildFormData } from './.kubb/config'

export function getUploadFileUrl(petId: UploadFilePathPetId) {
  const res = { method: 'POST', url: `/pet/${petId}/uploadImage` as const }

  return res
}

/**
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(petId: UploadFilePathPetId, data?: UploadFileData, config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const formData = buildFormData(requestData)

  const res = await request<UploadFileResponse, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl(petId).url.toString(),
    data: formData as FormData,
    ...requestConfig,
  })

  return res.data
}
