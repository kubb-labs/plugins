/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, UnwrappedResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { createClient } from './.kubb/client'

export class PetClient {
  private readonly client: ClientInstance

  constructor(config: ClientConfig = {}) {
    this.client = createClient(config)
  }

  /**
   * {@link /pet/:petId}
   */
  public getPetById<ThrowOnError extends boolean = true>(
    options: Options<GetPetByIdOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'GET', url: '/pet/{petId}', ...config }).then((result) => ((config.throwOnError ?? true) ? result.data : result)) as Promise<
      UnwrappedResult<GetPetByIdResponses, ThrowOnError>
    >
  }

  /**
   * {@link /pet/:petId}
   */
  public deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<DeletePetResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'DELETE', url: '/pet/{petId}', ...config }).then((result) => ((config.throwOnError ?? true) ? result.data : result)) as Promise<
      UnwrappedResult<DeletePetResponses, ThrowOnError>
    >
  }
}
