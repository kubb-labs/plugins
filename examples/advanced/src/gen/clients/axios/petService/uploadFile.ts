import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { UploadFileOptions, UploadFileResponses } from '../../../models/ts/pet/UploadFile.ts'
import { client } from '../../../.kubb/client.ts'

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileOptions, ThrowOnError>,
): Promise<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'POST',
    url: '/pet/{petId}/uploadImage',
    security: [{ type: 'oauth2' }],
    contentType: { request: 'application/octet-stream' },
    ...config,
  }) as Promise<RequestResult<UploadFileResponses, ThrowOnError>>
}
