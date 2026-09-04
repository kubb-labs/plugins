import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { UploadFileOptions, UploadFileResponses } from '../../../models/ts/pet/UploadFile'
import { client, withUnwrap } from '../../../.kubb/client'

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileOptions, ThrowOnError>,
): Unwrappable<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'POST',
      url: '/pet/{petId}/uploadImage',
      security: [{ type: 'oauth2' }],
      contentType: { request: 'application/octet-stream' },
      ...config,
    }) as Promise<RequestResult<UploadFileResponses, ThrowOnError>>,
  )
}
