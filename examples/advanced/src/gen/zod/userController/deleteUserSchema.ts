import * as z from 'zod'

export const deleteUserPathUsernameSchema = z.string().describe('The name that needs to be deleted')

export type DeleteUserPathUsernameSchema = z.infer<typeof deleteUserPathUsernameSchema>

export const deleteUserStatus400Schema = z.any()

export type DeleteUserStatus400Schema = z.infer<typeof deleteUserStatus400Schema>

export const deleteUserStatus404Schema = z.any()

export type DeleteUserStatus404Schema = z.infer<typeof deleteUserStatus404Schema>

export const deleteUserResponseSchema = z.union([deleteUserStatus400Schema, deleteUserStatus404Schema])

export type DeleteUserResponseSchema = z.infer<typeof deleteUserResponseSchema>
