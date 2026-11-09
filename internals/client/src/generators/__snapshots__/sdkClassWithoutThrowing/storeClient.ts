/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetInventoryOptions, GetInventoryResponses } from './GetInventory'
import { createClient, withUnwrap, resolveThrowOnError } from './.kubb/client'

export class StoreClient {
  private readonly client: ClientInstance

  constructor(config: ClientConfig = {}) {
    this.client = createClient(config)
  }

  /**
   * {@link /store/inventory}
   */
  public getInventory<ThrowOnError extends boolean = false>(
    options: Options<GetInventoryOptions, ThrowOnError> = {},
  ): Unwrappable<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return withUnwrap(
      apiClient<GetInventoryResponses, ThrowOnError>({
        method: 'GET',
        url: '/store/inventory',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, false),
      }),
    )
  }
}
