/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { createClient, withUnwrap } from './.kubb/client'

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
  ): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(request({ method: 'GET', url: '/pet/{petId}', ...config })) as Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>>
  }

  /**
   * {@link /pet/:petId}
   */
  public deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetOptions, ThrowOnError>,
  ): Unwrappable<RequestResult<DeletePetResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(request({ method: 'DELETE', url: '/pet/{petId}', ...config })) as Unwrappable<RequestResult<DeletePetResponses, ThrowOnError>>
  }
}
