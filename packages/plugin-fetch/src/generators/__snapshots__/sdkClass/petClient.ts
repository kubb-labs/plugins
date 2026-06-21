/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { DeletePetRequestConfig, DeletePetResponses } from './DeletePet'
import type { GetPetByIdRequestConfig, GetPetByIdResponses } from './GetPetById'
import { client } from './.kubb/client'

export class PetClient {
  /**
   * {@link /pet/:petId}
   */
  public static getPetById<ThrowOnError extends boolean = true>(
    options: Options<GetPetByIdRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
    const { client: request = client, ...config } = options

    return request({ method: 'GET', url: '/pet/{petId}', ...config }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
  }

  /**
   * {@link /pet/:petId}
   */
  public static deletePet<ThrowOnError extends boolean = true>(
    options: Options<DeletePetRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
    const { client: request = client, ...config } = options

    return request({ method: 'DELETE', url: '/pet/{petId}', ...config }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
  }
}
