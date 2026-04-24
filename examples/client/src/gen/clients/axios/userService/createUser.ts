/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { CreateUserResponse } from '../../../models/ts/userController/CreateUser.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getCreateUserUrl() {
  const res = { method: 'POST', url: `/user` as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser(data?: CreateUserData, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<CreateUserResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getCreateUserUrl().url.toString(),
    ...requestConfig,
  })

  return res.data
}
