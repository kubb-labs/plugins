/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance, Options, RequestResult } from './.kubb/client'
import type { GetProjectRequestConfig, GetProjectResponses } from './GetProject'
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
    options: Options<GetProjectRequestConfig, ThrowOnError>,
  ): Promise<RequestResult<GetProjectResponses, ThrowOnError>> {
    const { client: request = this.client, ...config } = options

    return request({
      method: 'GET',
      url: '/projects/{projectId}',
      meta: { operationId: 'getProject', schemaPath: '/projects/{project_id}' },
      ...config,
    }) as Promise<RequestResult<GetProjectResponses, ThrowOnError>>
  }
}
