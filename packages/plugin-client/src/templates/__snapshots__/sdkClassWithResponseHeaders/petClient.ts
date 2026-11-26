/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult, RequestResultWithHeaders } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses, DeletePetStatus204Headers } from './DeletePet'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { createClient, withUnwrap, resolveThrowOnError } from './.kubb/client'

type DeletePetResponseHeaders = { '204': DeletePetStatus204Headers }

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
  ): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return withUnwrap<RequestResult<GetPetByIdResponses, ThrowOnError>>(
      apiClient<GetPetByIdResponses, ThrowOnError>({
        method: 'GET',
        url: '/pet/{petId}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
    )
  }

  /**
   * `DELETE /pet/{petId}`
   */
  public deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetOptions, ThrowOnError>,
  ): Unwrappable<RequestResultWithHeaders<DeletePetResponses, DeletePetResponseHeaders, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return withUnwrap<RequestResultWithHeaders<DeletePetResponses, DeletePetResponseHeaders, ThrowOnError>>(
      apiClient<DeletePetResponses, ThrowOnError, DeletePetResponseHeaders>({
        method: 'DELETE',
        url: '/pet/{petId}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
    )
  }
}
