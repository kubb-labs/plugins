import type { CreateUsersWithListInputResponse, CreateUsersWithListInputData } from '../../models/ts/user/CreateUsersWithListInput.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function createUsersWithListInputHandlerResponse200(data: CreateUsersWithListInputResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function createUsersWithListInputHandler(
  data?: CreateUsersWithListInputResponse | HttpResponseResolver<Record<string, string>, CreateUsersWithListInputData, any>,
) {
  return http.post<Record<string, string>, CreateUsersWithListInputData, any>(`/user/createWithList`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
