import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LogoutUserResponse } from '../../../models/ts/userController/LogoutUser.ts'
import { logoutUserResponseSchema } from '../../../zod/userController/logoutUserSchema.ts'

export function getLogoutUserUrl() {
  const res = { method: 'GET', url: 'https://petstore3.swagger.io/api/v3/user/logout' as const }

  return res
}

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUser(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<LogoutUserResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getLogoutUserUrl().url.toString(),
    ...requestConfig,
  })

  return { ...res, data: logoutUserResponseSchema.parse(res.data) }
}
