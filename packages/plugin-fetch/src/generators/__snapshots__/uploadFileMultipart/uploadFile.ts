/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { UploadFileOptions, UploadFileResponses } from './UploadFile'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /pet/:petId/uploadImage}
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileOptions, ThrowOnError>,
): Unwrappable<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(request({ method: 'POST', url: '/pet/{petId}/uploadImage', contentType: { request: 'multipart/form-data' }, ...config })) as Unwrappable<
    RequestResult<UploadFileResponses, ThrowOnError>
  >
}
