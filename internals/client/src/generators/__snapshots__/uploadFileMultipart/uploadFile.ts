/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { UploadFileOptions, UploadFileResponses } from './UploadFile'
import { client, withUnwrap } from './.kubb/client'

/**
 * `POST /pet/{petId}/uploadImage`
 * @param options - The request (`path`, `body`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileOptions, ThrowOnError>,
): Unwrappable<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'POST',
      url: '/pet/{petId}/uploadImage',
      contentType: { request: 'multipart/form-data' },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<RequestResult<UploadFileResponses, ThrowOnError>>,
  )
}
