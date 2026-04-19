/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type {
  GetUserByNamePathUsername,
  GetUserByNameResponse,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../../models/ts/userController/GetUserByName.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getGetUserByNameUrl({ username }: { username: GetUserByNamePathUsername }) {
  const res = { method: 'GET', url: `/user/${username}` as const }

  return res
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByName({ username }: { username: GetUserByNamePathUsername }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetUserByNameResponse, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>, unknown>({
    method: 'GET',
    url: getGetUserByNameUrl({ username }).url.toString(),
    ...requestConfig,
  })

  return res.data
}
