/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from '../.kubb/client'
import type { GetProjectOptions, GetProjectResponses } from '../GetProject'
import { createClient, withUnwrap } from '../.kubb/client'

export class ProjectClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /projects/{project_id}`
   * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
   * @returns The result with `data` or `error`, `status`, `request`, and `response`.
   */
  public getProject<ThrowOnError extends boolean = true>(
    options: Options<GetProjectOptions, ThrowOnError>,
  ): Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(
      request({ method: 'GET', url: '/projects/{project_id}', ...config, throwOnError: config.throwOnError ?? true }) as Promise<
        RequestResult<GetProjectResponses, ThrowOnError>
      >,
    )
  }
}
