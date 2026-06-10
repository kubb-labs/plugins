import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileData, UploadFileStatus200 } from '../../../models/ts/pet/UploadFile.ts'
import { uploadFileResponseSchema, uploadFileDataSchema } from '../../../zod/pet/uploadFileSchema.ts'

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
  const { client: request = client, ...requestConfig } = config

  const requestData = uploadFileDataSchema.parse(data)

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    data: requestData,
    ...requestConfig,
    headers: { 'Content-Type': 'application/octet-stream', ...requestConfig.headers },
  })

  return { ...res, data: uploadFileResponseSchema.parse(res.data) } as { status: 200; data: UploadFileStatus200; statusText: string }
}
