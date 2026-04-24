/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput.js'
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
export async function createUsersWithListInput(data?: CreateUsersWithListInputData, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().url.toString(),
    ...requestConfig,
  })

  return res.data
}
