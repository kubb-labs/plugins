/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { createClient, withUnwrap, resolveThrowOnError } from './.kubb/client'

export class PetClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /pet/{petId}`
   * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
   * @returns The result with `data` or `error`, `status`, `request`, and `response`.
   */
  public getPetById<ThrowOnError extends boolean = false>(
    options: Options<GetPetByIdOptions, ThrowOnError>,
  ): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return withUnwrap(
      apiClient<GetPetByIdResponses, ThrowOnError>({
        method: 'GET',
        url: '/pet/{petId}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, false),
      }),
    )
  }

  /**
   * `DELETE /pet/{petId}`
   * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
   * @returns The result with `data` or `error`, `status`, `request`, and `response`.
   */
  public deletePet<ThrowOnError extends boolean = false>(
    options: Options<DeletePetOptions, ThrowOnError>,
  ): Unwrappable<RequestResult<DeletePetResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return withUnwrap(
      apiClient<DeletePetResponses, ThrowOnError>({
        method: 'DELETE',
        url: '/pet/{petId}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, false),
      }),
    )
  }
}
