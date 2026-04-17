/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import fetch from '@kubb/plugin-client/clients/fetch'
import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput.js'

function getCreateUsersWithListInputUrl() {
  const res = { method: 'POST', url: '/user/createWithList' as const }

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
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const res = await request<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputData>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
