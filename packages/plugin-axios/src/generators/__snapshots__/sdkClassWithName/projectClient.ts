/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, RequestResult } from './.kubb/client'
import type { GetProjectOptions, GetProjectResponses } from './GetProject'
import { createClient } from './.kubb/client'

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
  ): Promise<RequestResult<GetProjectResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({ method: 'GET', url: '/projects/{project_id}', ...config }) as Promise<RequestResult<GetProjectResponses, ThrowOnError>>
  }
}
