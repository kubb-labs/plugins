/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import fetch, { mergeConfig } from '@kubb/plugin-client/clients/fetch'
import type { CreateUserData, CreateUserResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { DeleteUserPathUsername, DeleteUserResponse, DeleteUserStatus400, DeleteUserStatus404 } from '../../../models/ts/userController/DeleteUser.ts'
import type {
  GetUserByNamePathUsername,
  GetUserByNameResponse,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../../models/ts/userController/GetUserByName.ts'
import type { LoginUserQueryPassword, LoginUserQueryUsername, LoginUserResponse, LoginUserStatus400 } from '../../../models/ts/userController/LoginUser.ts'
import type { LogoutUserResponse } from '../../../models/ts/userController/LogoutUser.ts'
import type { UpdateUserData, UpdateUserPathUsername, UpdateUserResponse } from '../../../models/ts/userController/UpdateUser.ts'

export class userController {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description This can only be done by the logged in user.
   * @summary Create user
   * {@link /user}
   */
  async createUser(data?: CreateUserData, config: Partial<RequestConfig<CreateUserData>> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<CreateUserResponse, ResponseErrorConfig<Error>, CreateUserData>({
      ...requestConfig,
      method: 'POST',
      url: '/user',
      data: requestData,
    })
    return res.data
  }

  /**
   * @description Creates list of users with given input array
   * @summary Creates list of users with given input array
   * {@link /user/createWithList}
   */
  async createUsersWithListInput(data?: CreateUsersWithListInputData, config: Partial<RequestConfig<CreateUsersWithListInputData>> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputData>({
      ...requestConfig,
      method: 'POST',
      url: '/user/createWithList',
      data: requestData,
    })
    return res.data
  }

  /**
   * @summary Logs user into the system
   * {@link /user/login}
   */
  async loginUser(
    params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword },
    config: Partial<RequestConfig> & { client?: Client } = {},
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<LoginUserResponse, ResponseErrorConfig<LoginUserStatus400>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: '/user/login',
      params,
    })
    return res.data
  }

  /**
   * @summary Logs out current logged in user session
   * {@link /user/logout}
   */
  async logoutUser(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<LogoutUserResponse, ResponseErrorConfig<Error>, unknown>({ ...requestConfig, method: 'GET', url: '/user/logout' })
    return res.data
  }

  /**
   * @summary Get user by user name
   * {@link /user/:username}
   */
  async getUserByName({ username }: { username: GetUserByNamePathUsername }, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetUserByNameResponse, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/user/${username}`,
    })
    return res.data
  }

  /**
   * @description This can only be done by the logged in user.
   * @summary Update user
   * {@link /user/:username}
   */
  async updateUser(
    { username }: { username: UpdateUserPathUsername },
    data?: UpdateUserData,
    config: Partial<RequestConfig<UpdateUserData>> & { client?: Client } = {},
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<UpdateUserResponse, ResponseErrorConfig<Error>, UpdateUserData>({
      ...requestConfig,
      method: 'PUT',
      url: `/user/${username}`,
      data: requestData,
    })
    return res.data
  }

  /**
   * @description This can only be done by the logged in user.
   * @summary Delete user
   * {@link /user/:username}
   */
  async deleteUser({ username }: { username: DeleteUserPathUsername }, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<DeleteUserResponse, ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>, unknown>({
      ...requestConfig,
      method: 'DELETE',
      url: `/user/${username}`,
    })
    return res.data
  }
}
