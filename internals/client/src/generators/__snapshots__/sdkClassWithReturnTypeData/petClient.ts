/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, UnwrappedResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { createClient, unwrapResult, resolveThrowOnError } from './.kubb/client'

export class PetClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /pet/{petId}`
   */
  public getPetById<ThrowOnError extends boolean = true>(
    options: Options<GetPetByIdOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return unwrapResult(
      apiClient<GetPetByIdResponses, ThrowOnError>({
        method: 'GET',
        url: '/pet/{petId}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
      resolveThrowOnError(config.throwOnError, true),
    )
  }

  /**
   * `DELETE /pet/{petId}`
   */
  public deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<DeletePetResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return unwrapResult(
      apiClient<DeletePetResponses, ThrowOnError>({
        method: 'DELETE',
        url: '/pet/{petId}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
      resolveThrowOnError(config.throwOnError, true),
    )
  }
}
