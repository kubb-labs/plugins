/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, RequestResult } from './.kubb/client.ts'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet.ts'
import type { GetInventoryOptions, GetInventoryResponses } from './GetInventory.ts'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById.ts'
import type { GetProjectOptions, GetProjectResponses } from './GetProject.ts'
import { createClient } from './.kubb/client.ts'

export class PetStore {
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

  /**
   * {@link /store/inventory}
   */
  public getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryOptions, ThrowOnError> = {},
  ): Promise<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'GET', url: '/store/inventory', ...config }) as Promise<RequestResult<GetInventoryResponses, ThrowOnError>>
  }

  /**
   * {@link /projects/:project_id}
   */
  public getProject<ThrowOnError extends boolean = true>(
    options: Options<GetProjectOptions, ThrowOnError>,
  ): Promise<RequestResult<GetProjectResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'GET', url: '/projects/{projectId}', ...config }) as Promise<RequestResult<GetProjectResponses, ThrowOnError>>
  }
}
