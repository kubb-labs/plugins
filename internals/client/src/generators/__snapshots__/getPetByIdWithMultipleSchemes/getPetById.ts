/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { client, withUnwrap } from './.kubb/client'

/**
 * `GET /pet/{petId}`
 * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'GET',
      url: '/pet/{petId}',
      security: [
        { type: 'oauth2', scopes: ['read:pets'] },
        { type: 'apiKey', name: 'api_key', in: 'header' },
      ],
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>,
  )
}
