/* eslint-disable no-alert, no-console */

import type { Options } from './.kubb/client'
import type { UploadFileOptions, UploadFileResponses } from './UploadFile'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /pet/{petId}/uploadImage`
 */
export function uploadFile<ThrowOnError extends boolean = true>(options: Options<UploadFileOptions, ThrowOnError>) {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<UploadFileResponses, ThrowOnError>({
      method: 'POST',
      url: '/pet/{petId}/uploadImage',
      contentType: { request: 'multipart/form-data' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
