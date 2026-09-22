/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetInventoryOptions, GetInventoryResponses } from './GetInventory'
import { createClient, withUnwrap } from './.kubb/client'

export class StoreClient {
  private readonly client: ClientInstance

  constructor(config: ClientConfig = {}) {
    this.client = createClient(config)
  }

  /**
   * {@link /store/inventory}
   */
  public getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryOptions, ThrowOnError> = {},
  ): Unwrappable<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(request({ method: 'GET', url: '/store/inventory', ...config }) as Promise<RequestResult<GetInventoryResponses, ThrowOnError>>)
  }
}
