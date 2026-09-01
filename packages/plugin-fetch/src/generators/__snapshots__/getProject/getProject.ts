/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetProjectOptions, GetProjectResponses } from './GetProject'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /projects/:project_id}
 */
export function getProject<ThrowOnError extends boolean = true>(
  options: Options<GetProjectOptions, ThrowOnError>,
): Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(request({ method: 'GET', url: '/projects/{project_id}', ...config })) as Unwrappable<RequestResult<GetProjectResponses, ThrowOnError>>
}
