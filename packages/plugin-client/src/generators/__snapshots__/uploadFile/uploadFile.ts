/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UploadFilePathPetId, UploadFileData, UploadFileStatus200 } from './UploadFile'
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
  { petId, data }: { petId: UploadFilePathPetId; data?: UploadFileData },
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestData = data
  const formData = buildFormData(requestData)

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    data: formData as FormData,
    ...requestConfig,
  })

  return res.data
}
