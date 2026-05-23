import * as z from 'zod'

export const loginUserQueryUsernameSchema = z.string().optional().describe('The user name for login')

export type LoginUserQueryUsernameSchema = z.infer<typeof loginUserQueryUsernameSchema>

export const loginUserQueryPasswordSchema = z.string().optional().describe('The password for login in clear text')

export type LoginUserQueryPasswordSchema = z.infer<typeof loginUserQueryPasswordSchema>
