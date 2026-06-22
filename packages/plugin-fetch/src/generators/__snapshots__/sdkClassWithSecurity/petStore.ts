/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, RequestResult } from './.kubb/client'
import type { DeletePetRequestConfig, DeletePetResponses } from './DeletePet'
import type { GetInventoryRequestConfig, GetInventoryResponses } from './GetInventory'
import type { GetPetByIdRequestConfig, GetPetByIdResponses } from './GetPetById'
import { createClient } from './.kubb/client'

export class PetStore {
  private readonly client: ClientInstance

  constructor(config: ClientConfig = {}) {
    this.client = createClient(config)
  }

  /**
   * {@link /pet/:petId}
   */
  public getPetById<ThrowOnError extends boolean = true>(
    options: Options<GetPetByIdRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({
      method: 'GET',
      url: '/pet/{petId}',
      security: [{ type: 'oauth2' }, { type: 'apiKey', name: 'api_key', in: 'header' }],
      ...config,
    }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
  }

  /**
   * {@link /pet/:petId}
   */
  public deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'DELETE', url: '/pet/{petId}', ...config }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
  }

  /**
   * {@link /store/inventory}
   */
  public getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'GET', url: '/store/inventory', ...config }) as Promise<RequestResult<GetInventoryResponses, ThrowOnError>>
  }
}
