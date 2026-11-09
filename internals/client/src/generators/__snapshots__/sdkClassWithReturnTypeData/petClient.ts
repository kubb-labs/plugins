/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, UnwrappedResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { createClient, unwrapResult } from './.kubb/client'

export class PetClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /pet/{petId}`
   * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
   * @returns The response body, or the full result when `throwOnError` is `false`.
   */
  public getPetById<ThrowOnError extends boolean = true>(
    options: Options<GetPetByIdOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return unwrapResult(
      request({ method: 'GET', url: '/pet/{petId}', ...config, throwOnError: config.throwOnError ?? true }),
      config.throwOnError ?? true,
    ) as Promise<UnwrappedResult<GetPetByIdResponses, ThrowOnError>>
  }

  /**
   * `DELETE /pet/{petId}`
   * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
   * @returns The response body, or the full result when `throwOnError` is `false`.
   */
  public deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<DeletePetResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return unwrapResult(
      request({ method: 'DELETE', url: '/pet/{petId}', ...config, throwOnError: config.throwOnError ?? true }),
      config.throwOnError ?? true,
    ) as Promise<UnwrappedResult<DeletePetResponses, ThrowOnError>>
  }
}
