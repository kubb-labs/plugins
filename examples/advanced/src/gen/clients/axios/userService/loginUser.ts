import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { LoginUserQueryUsername, LoginUserQueryPassword, LoginUserStatus200, LoginUserStatus400 } from '../../../models/ts/userController/LoginUser.ts'
import { loginUserResponseSchema } from '../../../zod/userController/loginUserSchema.ts'

export function getLoginUserUrl() {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/user/login` as const }

  return res
}

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUser(
  { params }: { params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword } } = {},
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<LoginUserStatus200, ResponseErrorConfig<LoginUserStatus400>, unknown>({
    method: 'GET',
    url: getLoginUserUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return { ...res, data: loginUserResponseSchema.parse(res.data) }
}
