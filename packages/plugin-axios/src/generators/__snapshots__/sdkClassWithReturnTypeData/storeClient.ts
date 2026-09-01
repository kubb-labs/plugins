/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, UnwrappedResult } from './.kubb/client'
import type { GetInventoryOptions, GetInventoryResponses } from './GetInventory'
import { createClient, unwrapResult } from './.kubb/client'

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
  ): Promise<UnwrappedResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return unwrapResult(request({ method: 'GET', url: '/store/inventory', ...config }), config.throwOnError) as Promise<
      UnwrappedResult<GetInventoryResponses, ThrowOnError>
    >
  }
}
