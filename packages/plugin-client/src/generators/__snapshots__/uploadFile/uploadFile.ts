/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UploadFileRequestConfig, UploadFilePathPetId, UploadFileData, UploadFileStatus200 } from './UploadFile'
import { client } from './.kubb/client'
import { buildFormData } from './.kubb/config'

export function getUploadFileUrl(path: { petId: UploadFilePathPetId }) {
  const res = { method: 'POST', url: `/pet/${path.petId}/uploadImage` as const }

  return res
}

/**
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { path, body }: Omit<UploadFileRequestConfig, 'url'>,
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestBody = body
  const formData = buildFormData(requestBody)

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl(path).url.toString(),
    body: formData as FormData,
    ...requestConfig,
  })

  return res.data
}
