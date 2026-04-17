/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import fetch from '@kubb/plugin-client/clients/fetch'
import type { UpdateUserData, UpdateUserPathUsername, UpdateUserResponse } from '../../../models/ts/userController/UpdateUser.js'

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
  config: Partial<RequestConfig<UpdateUserData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const res = await request<UpdateUserResponse, ResponseErrorConfig<Error>, UpdateUserData>({
    method: 'PUT',
    url: getUpdateUserUrl({ username }).url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
