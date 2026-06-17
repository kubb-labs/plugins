/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.js'
import type {
  GetUserByNamePathUsername,
  GetUserByNameStatus200,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../../models/ts/user/GetUserByName.js'
import { client } from '../../../.kubb/client.js'

function getGetUserByNameUrl({ username }: { username: GetUserByNamePathUsername }) {
  const res = { method: 'GET', url: `/user/${username}` as const }

  return res
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByName({ username }: { username: GetUserByNamePathUsername }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetUserByNameStatus200, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>, unknown>({
    method: 'GET',
    url: getGetUserByNameUrl({ username }).url.toString(),
    ...requestConfig,
  })

  return res.data
}
