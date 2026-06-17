/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.js'
import type { CreateUserData, CreateUserResponse } from '../../../models/ts/user/CreateUser.js'
import { client } from '../../../.kubb/client.js'

function getCreateUserUrl() {
  const res = { method: 'POST', url: `/user` as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser(
  data?: CreateUserData,
  config: Partial<RequestConfig<CreateUserData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = data

  const res = await request<CreateUserResponse, ResponseErrorConfig<Error>, CreateUserData>({
    method: 'POST',
    url: getCreateUserUrl().url.toString(),
    data: requestData,
    contentType,
    ...requestConfig,
  })

  return res.data
}
