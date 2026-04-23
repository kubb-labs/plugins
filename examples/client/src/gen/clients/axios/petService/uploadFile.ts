/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileData, UploadFileResponse } from '../../../models/ts/petController/UploadFile.js'
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
  { petId }: { petId: UploadFilePathPetId },
  data: UploadFileData,
  params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata },
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const formData = buildFormData(requestData)

  const res = await request<UploadFileResponse, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    data: formData as FormData,
    ...requestConfig,
  })

  return res.data
}
