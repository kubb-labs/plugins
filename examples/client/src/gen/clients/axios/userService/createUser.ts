/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { CreateUserData, CreateUserResponse } from '../../../models/ts/userController/CreateUser.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getCreateUserUrl() {
  const res = { method: 'POST', url: '/user' as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser(data?: CreateUserData, config: Partial<RequestConfig<CreateUserData>> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const res = await request<CreateUserResponse, ResponseErrorConfig<Error>, CreateUserData>({
    method: 'POST',
    url: getCreateUserUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
