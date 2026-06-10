import type { CreateUserData } from '../../models/ts/user/CreateUser.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function createUserHandler(data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, CreateUserData, any>) {
  return http.post<Record<string, string>, CreateUserData, any>(`/user`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
