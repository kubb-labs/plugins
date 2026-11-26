/* eslint-disable no-alert, no-console */

import type { Options } from './.kubb/client'
import type { AddPetOptions, AddPetResponses } from './AddPet'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `POST /pet`
 */
export function addPet<ThrowOnError extends boolean = true>(options: Options<AddPetOptions, ThrowOnError>) {
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
