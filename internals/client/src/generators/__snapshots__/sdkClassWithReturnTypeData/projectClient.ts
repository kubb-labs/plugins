/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, UnwrappedResult } from './.kubb/client'
import type { GetProjectOptions, GetProjectResponses } from './GetProject'
import { createClient, unwrapResult, resolveThrowOnError } from './.kubb/client'

export class ProjectClient {
  private readonly client: ClientInstance

  constructor(config: ClientConfig = {}) {
    this.client = createClient(config)
  }

  /**
   * {@link /projects/:project_id}
   */
  public getProject<ThrowOnError extends boolean = true>(
    options: Options<GetProjectOptions, ThrowOnError>,
  ): Promise<UnwrappedResult<GetProjectResponses, ThrowOnError>> {
    const { client: apiClient = this.client, ...config } = options

    return unwrapResult(
      apiClient<GetProjectResponses, ThrowOnError>({
        method: 'GET',
        url: '/projects/{project_id}',
        ...config,
        throwOnError: resolveThrowOnError(config.throwOnError, true),
      }),
      resolveThrowOnError(config.throwOnError, true),
    )
  }
}
