import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileStatus200 } from '../../../models/ts/pet/UploadFile.ts'
import { uploadFileResponseSchema } from '../../../zod/pet/uploadFileSchema.ts'

export function getUploadFileUrl({ petId }: { petId: UploadFilePathPetId }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${petId}/uploadImage` as const }

  return res
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { petId, params }: { petId: UploadFilePathPetId; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    ...requestConfig,
  })

  return { ...res, data: uploadFileResponseSchema.parse(res.data) } as { status: 200; data: UploadFileStatus200; statusText: string }
}
