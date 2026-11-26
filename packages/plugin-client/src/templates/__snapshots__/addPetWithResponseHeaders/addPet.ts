/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResultWithHeaders } from './.kubb/client'
import type { AddPetOptions, AddPetResponses, AddPetStatus201Headers, AddPetStatus405Headers } from './AddPet'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

type AddPetResponseHeaders = { '201': AddPetStatus201Headers; '405': AddPetStatus405Headers }

/**
 * `POST /pet`
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Unwrappable<RequestResultWithHeaders<AddPetResponses, AddPetResponseHeaders, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap<RequestResultWithHeaders<AddPetResponses, AddPetResponseHeaders, ThrowOnError>>(
    apiClient<AddPetResponses, ThrowOnError, AddPetResponseHeaders>({
      method: 'POST',
      url: '/pet',
      contentType: { request: 'application/json' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
