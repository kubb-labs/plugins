import type { UpdateUserData } from '../../models/ts/userController/UpdateUser.ts'
import type { HttpResponseResolver } from 'msw'
import { http } from 'msw'

export function updateUserHandler(data?: string | number | boolean | null | object | HttpResponseResolver<Record<string, string>, UpdateUserData, any>) {
  return http.put<Record<string, string>, UpdateUserData, any>(`/user/:username`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
