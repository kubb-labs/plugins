/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileResponse } from '../../../models/ts/petController/UploadFile.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

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
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UploadFileResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
