import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileResponse } from '../../../models/ts/petController/UploadFile.ts'
import { uploadFileResponseSchema } from '../../../zod/petController/uploadFileSchema.ts'

export function getUploadFileUrl({ petId }: { petId: UploadFilePathPetId }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${petId}/uploadImage` as const }

  return res
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { petId, data, params }: { petId: UploadFilePathPetId; data: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UploadFileResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    ...requestConfig,
  })

  return { ...res, data: uploadFileResponseSchema.parse(res.data) }
}
