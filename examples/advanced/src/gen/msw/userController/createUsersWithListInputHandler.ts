import type { CreateUsersWithListInputResponse, CreateUsersWithListInputData } from '../../models/ts/userController/CreateUsersWithListInput.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function createUsersWithListInputHandlerResponse200(data?: CreateUsersWithListInputResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
  })
}

export function createUsersWithListInputHandler(
  data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, CreateUsersWithListInputData, any>,
) {
  return http.post<Record<string, string>, CreateUsersWithListInputData, any>(`/user/createWithList`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
