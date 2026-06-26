/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { UploadFileRequestConfig, UploadFileResponses } from './UploadFile'
import { client } from './.kubb/client'

/**
 * {@link /pet/:petId/uploadImage}
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileRequestConfig, ThrowOnError>,
): Promise<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'POST',
    url: '/pet/{petId}/uploadImage',
    contentType: 'multipart/form-data',
    meta: { operationId: 'uploadFile', schemaPath: '/pet/{petId}/uploadImage' },
    ...config,
  }) as Promise<RequestResult<UploadFileResponses, ThrowOnError>>
}
