import * as z from 'zod'

export const logoutUserStatusDefaultSchema = z.any()

export type LogoutUserStatusDefaultSchemaType = z.infer<typeof logoutUserStatusDefaultSchema>

export const logoutUserResponseSchema = logoutUserStatusDefaultSchema

export type LogoutUserResponseSchemaType = z.infer<typeof logoutUserResponseSchema>
