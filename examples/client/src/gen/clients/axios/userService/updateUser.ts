/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.js'
import type { UpdateUserPathUsername, UpdateUserData, UpdateUserResponse } from '../../../models/ts/user/UpdateUser.js'
import { client } from '../../../.kubb/client.js'

function getUpdateUserUrl({ username }: { username: UpdateUserPathUsername }) {
  const res = { method: 'PUT', url: `/user/${username}` as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export async function updateUser(
  { username }: { username: UpdateUserPathUsername },
  data?: UpdateUserData,
  config: Partial<RequestConfig<UpdateUserData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = data

  const res = await request<UpdateUserResponse, ResponseErrorConfig<Error>, UpdateUserData>({
    method: 'PUT',
    url: getUpdateUserUrl({ username }).url.toString(),
    data: requestData,
    contentType,
    ...requestConfig,
  })

  return res.data
}
