/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { GetOrganizationRequestConfig, GetOrganizationPathOrganizationId, GetOrganizationStatus200 } from './GetOrganization'
import { client } from './.kubb/client'

export function getGetOrganizationUrl(path: { organizationId: GetOrganizationPathOrganizationId }) {
  const res = { method: 'GET', url: `/organizations/${path.organizationId}` as const }

  return res
}

/**
 * {@link /organizations/:organization-id}
 */
export async function getOrganization({ path }: Omit<GetOrganizationRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetOrganizationStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getGetOrganizationUrl(path).url.toString(),
    ...requestConfig,
  })

  return res.data
}
