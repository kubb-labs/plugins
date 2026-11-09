/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { AddPetOptions, AddPetResponses } from './AddPet'
import { client, withUnwrap } from './.kubb/client'

/**
 * `POST /pet`
 * @param options - The request (`body`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Unwrappable<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'POST',
      url: '/pet',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      contentType: { request: 'application/json' },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>,
  )
}
