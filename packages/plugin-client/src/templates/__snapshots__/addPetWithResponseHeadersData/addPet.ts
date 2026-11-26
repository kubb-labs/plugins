/* eslint-disable no-alert, no-console */

import type { Options, UnwrappedResultWithHeaders } from './.kubb/client'
import type { AddPetOptions, AddPetResponses, AddPetStatus201Headers, AddPetStatus405Headers } from './AddPet'
import { client, unwrapResult, resolveThrowOnError } from './.kubb/client'

type AddPetResponseHeaders = { '201': AddPetStatus201Headers; '405': AddPetStatus405Headers }

/**
 * `POST /pet`
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Promise<UnwrappedResultWithHeaders<AddPetResponses, AddPetResponseHeaders, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return unwrapResult(
    apiClient<AddPetResponses, ThrowOnError, AddPetResponseHeaders>({
      method: 'POST',
      url: '/pet',
      contentType: { request: 'application/json' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
    resolveThrowOnError(config.throwOnError, true),
  )
}
