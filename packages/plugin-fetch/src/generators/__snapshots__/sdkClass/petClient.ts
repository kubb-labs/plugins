/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, RequestResult } from './.kubb/client.ts'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet.ts'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById.ts'
import { createClient } from './.kubb/client.ts'

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
  ): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'GET', url: '/pet/{petId}', ...config }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
  }

  /**
   * {@link /pet/:petId}
   */
  public deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetOptions, ThrowOnError>,
  ): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'DELETE', url: '/pet/{petId}', ...config }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
  }
}
