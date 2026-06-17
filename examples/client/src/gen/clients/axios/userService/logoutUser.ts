/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { LogoutUserResponse } from '../../../models/ts/user/LogoutUser.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getLogoutUserUrl() {
  const res = { method: 'GET', url: `/user/logout` as const }

  return res
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LogoutUserResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getLogoutUserUrl().url.toString(),
    ...requestConfig,
  })

  return res.data
}
