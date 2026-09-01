/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import type { GetInventoryOptions, GetInventoryResponses } from './GetInventory'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import type { GetProjectOptions, GetProjectResponses } from './GetProject'
import { createClient, withUnwrap } from './.kubb/client'

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
  ): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(
      request({ method: 'GET', url: '/pet/{petId}', security: [{ type: 'oauth2' }, { type: 'apiKey', name: 'api_key', in: 'header' }], ...config }),
    ) as Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>>
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

  /**
   * {@link /store/inventory}
   */
  public getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryOptions, ThrowOnError> = {},
  ): Unwrappable<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(request({ method: 'GET', url: '/store/inventory', ...config })) as Unwrappable<RequestResult<GetInventoryResponses, ThrowOnError>>
  }

  /**
   * {@link /projects/:project_id}
   */
  public getProject<ThrowOnError extends boolean = true>(
    options: Options<GetProjectOptions, ThrowOnError>,
  ): Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(request({ method: 'GET', url: '/projects/{project_id}', ...config })) as Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>>
  }
}
