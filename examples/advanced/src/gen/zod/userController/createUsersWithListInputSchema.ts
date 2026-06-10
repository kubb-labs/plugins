import * as z from 'zod'
import { userSchema } from '../userSchema.ts'

export const createUsersWithListInputStatus200SchemaJson = userSchema

export type CreateUsersWithListInputStatus200SchemaJsonType = z.infer<typeof createUsersWithListInputStatus200SchemaJson>

export const createUsersWithListInputStatus200SchemaXml = userSchema

export type CreateUsersWithListInputStatus200SchemaXmlType = z.infer<typeof createUsersWithListInputStatus200SchemaXml>

export const createUsersWithListInputStatus200Schema = z.union([createUsersWithListInputStatus200SchemaJson, createUsersWithListInputStatus200SchemaXml])

export type CreateUsersWithListInputStatus200SchemaType = z.infer<typeof createUsersWithListInputStatus200Schema>

export const createUsersWithListInputStatusDefaultSchema = z.any()

export type CreateUsersWithListInputStatusDefaultSchemaType = z.infer<typeof createUsersWithListInputStatusDefaultSchema>

export const createUsersWithListInputResponseSchema = z.union([createUsersWithListInputStatus200Schema, createUsersWithListInputStatusDefaultSchema])

export type CreateUsersWithListInputResponseSchemaType = z.infer<typeof createUsersWithListInputResponseSchema>

export const createUsersWithListInputDataSchema = z.array(userSchema).optional()

export type CreateUsersWithListInputDataSchemaType = z.infer<typeof createUsersWithListInputDataSchema>
