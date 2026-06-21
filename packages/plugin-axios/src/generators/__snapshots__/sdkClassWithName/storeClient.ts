/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, RequestResult } from './.kubb/client'
import type { GetInventoryRequestConfig, GetInventoryResponses } from './GetInventory'
import { createClient } from './.kubb/client'

export class StoreClient {
  private readonly client: ClientInstance

  constructor(config: ClientConfig = {}) {
    this.client = createClient(config)
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
