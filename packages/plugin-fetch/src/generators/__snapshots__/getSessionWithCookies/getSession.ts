/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { GetSessionRequestConfig, GetSessionResponses } from './GetSession'
import { client } from './.kubb/client'

/**
 * {@link /session}
 */
export function getSession<ThrowOnError extends boolean = true>(
  options: Options<GetSessionRequestConfig, ThrowOnError>,
): Promise<RequestResult<GetSessionResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/session', meta: { operationId: 'getSession', schemaPath: '/session' }, ...config }) as Promise<
    RequestResult<GetSessionResponses, ThrowOnError>
  >
}
