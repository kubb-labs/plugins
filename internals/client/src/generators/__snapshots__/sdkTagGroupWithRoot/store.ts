/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from '../.kubb/client'
import type { GetInventoryOptions, GetInventoryResponses } from '../GetInventory'
import { createClient, withUnwrap } from '../.kubb/client'

export class StoreClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /store/inventory`
   * @param options - Per-call settings, such as `client` and `throwOnError`.
   * @returns The result with `data` or `error`, `status`, `request`, and `response`.
   */
  public getInventory<ThrowOnError extends boolean = true>(
    options: Options<GetInventoryOptions, ThrowOnError> = {},
  ): Unwrappable<RequestResult<GetInventoryResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(
      request({ method: 'GET', url: '/store/inventory', ...config, throwOnError: config.throwOnError ?? true }) as Promise<
        RequestResult<GetInventoryResponses, ThrowOnError>
      >,
    )
  }
}
