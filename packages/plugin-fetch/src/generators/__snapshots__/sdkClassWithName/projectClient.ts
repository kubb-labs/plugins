/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetProjectOptions, GetProjectResponses } from './GetProject'
import { createClient, withUnwrap } from './.kubb/client'

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
  ): Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return withUnwrap(request({ method: 'GET', url: '/projects/{project_id}', ...config })) as Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>>
  }
}
