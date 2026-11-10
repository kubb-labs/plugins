/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetProjectOptions, GetProjectResponses } from './GetProject'
import { createClient, withUnwrap, resolveThrowOnError } from './.kubb/client'

export class ProjectClient {
  readonly client: ClientInstance

  constructor(config: ClientConfig | ClientInstance = {}) {
    this.client = typeof config === 'function' ? config : createClient(config)
  }

  /**
   * `GET /projects/{project_id}`
   */
  public getProject<ThrowOnError extends boolean = true>(
    options: Options<GetProjectOptions, ThrowOnError>,
  ): Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return withUnwrap(
      apiClient<GetProjectResponses, ThrowOnError>({
        method: 'GET',
        url: '/projects/{project_id}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
    )
  }
}
