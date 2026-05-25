/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { User } from '../../../models/ts/User.js'
import type { CreateUsersWithListInputData } from '../../../models/ts/userController/CreateUsersWithListInput.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getCreateUsersWithListInputUrl() {
  const res = { method: 'POST', url: `/user/createWithList` as const }

  return res
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInput(
  data?: CreateUsersWithListInputData,
  config: Partial<RequestConfig<CreateUsersWithListInputData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestData = data

  const res = await request<User, ResponseErrorConfig<Error>, CreateUsersWithListInputData>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
