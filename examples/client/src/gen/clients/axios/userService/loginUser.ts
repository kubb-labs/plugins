/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { LoginUserQueryUsername, LoginUserQueryPassword, LoginUserResponse, LoginUserStatus400 } from '../../../models/ts/userController/LoginUser.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getLoginUserUrl() {
  const res = { method: 'GET', url: '/user/login' as const }

  return res
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUser(
  params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LoginUserResponse, ResponseErrorConfig<LoginUserStatus400>, unknown>({
    method: 'GET',
    url: getLoginUserUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
