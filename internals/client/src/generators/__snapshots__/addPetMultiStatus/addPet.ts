/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { AddPetOptions, AddPetResponses } from './AddPet'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /pet`
 * @param options - The request (`body`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Unwrappable<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<AddPetResponses, ThrowOnError>({
      method: 'POST',
      url: '/pet',
      contentType: { request: 'application/json' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
