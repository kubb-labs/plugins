import * as z from 'zod'

export const logoutUserStatusDefaultSchema = z.any()

export type LogoutUserStatusDefaultSchema = z.infer<typeof logoutUserStatusDefaultSchema>

export const logoutUserResponseSchema = logoutUserStatusDefaultSchema

export type LogoutUserResponseSchema = z.infer<typeof logoutUserResponseSchema>
