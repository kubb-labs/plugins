/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { UploadFileRequestConfig, UploadFilePathPetId, UploadFileData, UploadFileStatus200 } from '../../../models/ts/pet/UploadFile.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import { buildFormData } from '../../../.kubb/config.js'

function getUploadFileUrl({ petId }: { petId: UploadFilePathPetId }) {
  const res = { method: 'POST', url: `/pet/${petId}/uploadImage` as const }

  return res
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { path, query, body }: Omit<UploadFileRequestConfig, 'url'>,
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = body
  const formData = buildFormData(requestData)

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl(path).url.toString(),
    query,
    body: contentType === 'multipart/form-data' ? (formData as FormData) : requestData,
    contentType,
    ...requestConfig,
  })

  return res.data
}
