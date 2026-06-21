/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { GetInventoryRequestConfig, GetInventoryResponses } from './GetInventory'
import { client } from './.kubb/client'

export class StoreClient {
  /**
   * {@link /store/inventory}
   */
  public static getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = client, ...config } = options

    return request({ method: 'GET', url: '/store/inventory', ...config }) as Promise<RequestResult<GetInventoryResponses, ThrowOnError>>
  }
}
