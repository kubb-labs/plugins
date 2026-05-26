import * as z from 'zod'
import { userSchema } from '../userSchema.ts'

export const getUserByNamePathUsernameSchema = z.string().describe('The name that needs to be fetched. Use user1 for testing. ')

export type GetUserByNamePathUsernameSchema = z.infer<typeof getUserByNamePathUsernameSchema>

export const getUserByNameStatus200SchemaJson = userSchema

export type GetUserByNameStatus200SchemaJson = z.infer<typeof getUserByNameStatus200SchemaJson>

export const getUserByNameStatus200SchemaXml = userSchema

export type GetUserByNameStatus200SchemaXml = z.infer<typeof getUserByNameStatus200SchemaXml>

export const getUserByNameStatus200Schema = z.union([getUserByNameStatus200SchemaJson, getUserByNameStatus200SchemaXml])

export type GetUserByNameStatus200Schema = z.infer<typeof getUserByNameStatus200Schema>

export const getUserByNameStatus400Schema = z.any()

export type GetUserByNameStatus400Schema = z.infer<typeof getUserByNameStatus400Schema>

export const getUserByNameStatus404Schema = z.any()

export type GetUserByNameStatus404Schema = z.infer<typeof getUserByNameStatus404Schema>

export const getUserByNameResponseSchema = z.union([getUserByNameStatus200Schema, getUserByNameStatus400Schema, getUserByNameStatus404Schema])

export type GetUserByNameResponseSchema = z.infer<typeof getUserByNameResponseSchema>
