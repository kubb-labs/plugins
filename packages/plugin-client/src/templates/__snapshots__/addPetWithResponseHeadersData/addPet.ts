/* eslint-disable no-alert, no-console */

import type { Options, UnwrappedResultWithHeaders } from './.kubb/client'
import type { AddPetOptions, AddPetResponses, AddPetStatus201Headers, AddPetStatus405Headers } from './AddPet'
import { client, unwrapResult, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /pet`
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Promise<UnwrappedResultWithHeaders<AddPetResponses, { '201': AddPetStatus201Headers; '405': AddPetStatus405Headers }, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return unwrapResult(
    apiClient<AddPetResponses, ThrowOnError, { '201': AddPetStatus201Headers; '405': AddPetStatus405Headers }>({
      method: 'POST',
      url: '/pet',
      contentType: { request: 'application/json' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
    resolveThrowOnError(config.throwOnError, true),
  )
}
