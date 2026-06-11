import * as z from 'zod'
import { userSchema } from '../userSchema.ts'

export const getUserByNamePathUsernameSchema = z.string().describe('The name that needs to be fetched. Use user1 for testing. ')

export type GetUserByNamePathUsernameSchemaType = z.infer<typeof getUserByNamePathUsernameSchema>

export const getUserByNameStatus200SchemaJson = userSchema

export type GetUserByNameStatus200SchemaJsonType = z.infer<typeof getUserByNameStatus200SchemaJson>

export const getUserByNameStatus200SchemaXml = userSchema

export type GetUserByNameStatus200SchemaXmlType = z.infer<typeof getUserByNameStatus200SchemaXml>

export const getUserByNameStatus200Schema = z.union([getUserByNameStatus200SchemaJson, getUserByNameStatus200SchemaXml])

export type GetUserByNameStatus200SchemaType = z.infer<typeof getUserByNameStatus200Schema>

export const getUserByNameStatus400Schema = z.any()

export type GetUserByNameStatus400SchemaType = z.infer<typeof getUserByNameStatus400Schema>

export const getUserByNameStatus404Schema = z.any()

export type GetUserByNameStatus404SchemaType = z.infer<typeof getUserByNameStatus404Schema>

export const getUserByNameResponseSchema = getUserByNameStatus200Schema

export type GetUserByNameResponseSchemaType = z.infer<typeof getUserByNameResponseSchema>
