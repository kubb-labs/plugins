/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client.ts'
import type { UploadFileOptions, UploadFileResponses } from './UploadFile.ts'
import { client } from './.kubb/client.ts'

/**
 * {@link /pet/:petId/uploadImage}
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileOptions, ThrowOnError>,
): Promise<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pet/{petId}/uploadImage', contentType: { request: 'multipart/form-data' }, ...config }) as Promise<
    RequestResult<UploadFileResponses, ThrowOnError>
  >
}
