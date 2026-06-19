import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFileRequestConfig, UploadFilePathPetId, UploadFileData, UploadFileStatus200 } from '../../../models/ts/pet/UploadFile.ts'

export function getUploadFileUrl({ petId }: { petId: UploadFilePathPetId }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${petId}/uploadImage` as const }

  return res
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { path, query, body }: Omit<UploadFileRequestConfig, 'url'>,
  config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestBody = body

  const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
    method: 'POST',
    url: getUploadFileUrl(path).url.toString(),
    query,
    body: requestBody,
    ...requestConfig,
    headers: { 'Content-Type': 'application/octet-stream', ...requestConfig.headers },
  })

  return res as { status: 200; data: UploadFileStatus200; statusText: string }
}
