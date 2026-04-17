import type { LoginUserResponse, LoginUserStatus400 } from '../../models/ts/userController/LoginUser.ts'
import { http } from 'msw'

export function loginUserHandlerResponse200(data: LoginUserResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

export function loginUserHandlerResponse400(data?: LoginUserStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function loginUserHandler(data?: LoginUserResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>)) {
  return http.get('/user/login', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  })
}
