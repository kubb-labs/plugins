import * as z from 'zod'

export const updateUserPathUsernameSchema = z.string().describe('name that need to be deleted')

export type UpdateUserPathUsernameSchema = z.infer<typeof updateUserPathUsernameSchema>

export const updateUserStatusDefaultSchema = z.any()

export type UpdateUserStatusDefaultSchema = z.infer<typeof updateUserStatusDefaultSchema>

export const updateUserResponseSchema = updateUserStatusDefaultSchema

export type UpdateUserResponseSchema = z.infer<typeof updateUserResponseSchema>
