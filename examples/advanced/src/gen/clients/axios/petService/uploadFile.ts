import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { UploadFileData, UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileResponse } from '../../../models/ts/petController/UploadFile.ts'
import { uploadFileDataSchema, uploadFileResponseSchema } from '../../../zod/petController/uploadFileSchema.ts'

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
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = uploadFileDataSchema.parse(data)

  const res = await request<UploadFileResponse, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    data: requestData,
    ...requestConfig,
    headers: { 'Content-Type': 'application/octet-stream', ...requestConfig.headers },
  })

  return { ...res, data: uploadFileResponseSchema.parse(res.data) }
}
