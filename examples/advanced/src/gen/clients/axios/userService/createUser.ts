import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserData, CreateUserStatusDefault } from '../../../models/ts/user/CreateUser.ts'
import type { z } from 'zod'
import { createUserResponseSchema, createUserDataSchema } from '../../../zod/user/createUserSchema.ts'

export function getCreateUserUrl() {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/user` as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser(
  { data }: { data?: CreateUserData } = {},
  config: Partial<RequestConfig<CreateUserData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = createUserDataSchema.parse(data)

  const res = await request<CreateUserStatusDefault, ResponseErrorConfig<Error>, z.output<typeof createUserDataSchema>>({
    method: 'POST',
    url: getCreateUserUrl().url.toString(),
    data: requestData,
    contentType,
    ...requestConfig,
  })

  return { ...res, data: createUserResponseSchema.parse(res.data) } as { status: number; data: CreateUserStatusDefault; statusText: string }
}
