/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { UpdateUserPathUsername, UpdateUserResponse } from '../../../models/ts/userController/UpdateUser.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

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
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UpdateUserResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'PUT',
    url: getUpdateUserUrl({ username }).url.toString(),
    ...requestConfig,
  })

  return res.data
}
