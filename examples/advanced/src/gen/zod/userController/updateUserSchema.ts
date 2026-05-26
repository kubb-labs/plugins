import * as z from 'zod'
import { userSchema } from '../userSchema.ts'

export const updateUserPathUsernameSchema = z.string().describe('name that need to be deleted')

export type UpdateUserPathUsernameSchema = z.infer<typeof updateUserPathUsernameSchema>

export const updateUserStatusDefaultSchema = z.any()

export type UpdateUserStatusDefaultSchema = z.infer<typeof updateUserStatusDefaultSchema>

export const updateUserResponseSchema = updateUserStatusDefaultSchema

export type UpdateUserResponseSchema = z.infer<typeof updateUserResponseSchema>

export const updateUserDataSchemaJson = userSchema.optional().describe('Update an existent user in the store')

export type UpdateUserDataSchemaJson = z.infer<typeof updateUserDataSchemaJson>

export const updateUserDataSchemaXml = userSchema.optional().describe('Update an existent user in the store')

export type UpdateUserDataSchemaXml = z.infer<typeof updateUserDataSchemaXml>

export const updateUserDataSchemaFormUrlEncoded = userSchema.optional().describe('Update an existent user in the store')

export type UpdateUserDataSchemaFormUrlEncoded = z.infer<typeof updateUserDataSchemaFormUrlEncoded>

export const updateUserDataSchema = z.union([updateUserDataSchemaJson, updateUserDataSchemaXml, updateUserDataSchemaFormUrlEncoded])

export type UpdateUserDataSchema = z.infer<typeof updateUserDataSchema>
