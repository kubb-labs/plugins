/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from '../../../.kubb/client.js'
import type { UploadFileRequestConfig, UploadFileResponses } from '../../../models/ts/pet/UploadFile.js'
import { client } from '../../../.kubb/client.js'

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
