/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client.ts'
import type { GetProjectOptions, GetProjectResponses } from './GetProject.ts'
import { client } from './.kubb/client.ts'

/**
 * {@link /projects/:project_id}
 */
export function getProject<ThrowOnError extends boolean = true>(
  options: Options<GetProjectOptions, ThrowOnError>,
): Promise<RequestResult<GetProjectResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/projects/{projectId}', ...config }) as Promise<RequestResult<GetProjectResponses, ThrowOnError>>
}
