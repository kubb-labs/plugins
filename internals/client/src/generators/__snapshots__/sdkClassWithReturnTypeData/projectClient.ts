/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, UnwrappedResult } from './.kubb/client'
import type { GetProjectOptions, GetProjectResponses } from './GetProject'
import { createClient, unwrapResult } from './.kubb/client'

export class ProjectClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /projects/{project_id}`
   * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
   * @returns The response body, or the full result when `throwOnError` is `false`.
   */
  public getProject<ThrowOnError extends boolean = true>(
    options: Options<GetProjectOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<GetProjectResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return unwrapResult(
      request({ method: 'GET', url: '/projects/{project_id}', ...config, throwOnError: config.throwOnError ?? true }),
      config.throwOnError ?? true,
    ) as Promise<UnwrappedResult<GetProjectResponses, ThrowOnError>>
  }
}
