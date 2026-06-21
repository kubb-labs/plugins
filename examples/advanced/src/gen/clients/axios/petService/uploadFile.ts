import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { UploadFileRequestConfig, UploadFileResponses } from '../../../models/ts/pet/UploadFile.ts'
import { client } from '../../../.kubb/client.ts'

export function getUploadFileUrl(path: UploadFileRequestConfig['path']) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${path.petId}/uploadImage` as const }

  return res
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileRequestConfig, ThrowOnError>,
): Promise<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pet/{petId}/uploadImage', ...config }) as Promise<RequestResult<UploadFileResponses, ThrowOnError>>
}
