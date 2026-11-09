/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, UnwrappedResult } from './.kubb/client'
import type { GetInventoryOptions, GetInventoryResponses } from './GetInventory'
import { createClient, unwrapResult, resolveThrowOnError } from './.kubb/client'

export class StoreClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /store/inventory`
   * @param options - Per-call settings, such as `client` and `throwOnError`.
   * @returns The response body, or the full result when `throwOnError` is `false`.
   */
  public getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryOptions, ThrowOnError> = {},
  ): Promise<UnwrappedResult<GetInventoryResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return unwrapResult(
      apiClient<GetInventoryResponses, ThrowOnError>({
        method: 'GET',
        url: '/store/inventory',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
      resolveThrowOnError(config.throwOnError, true),
    )
  }
}
