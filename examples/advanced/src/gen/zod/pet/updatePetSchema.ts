import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const updatePetStatus200SchemaJson = z.lazy(() => petSchema.omit({ name: true }))

export type UpdatePetStatus200SchemaJsonType = z.infer<typeof updatePetStatus200SchemaJson>

export const updatePetStatus200SchemaXml = z.lazy(() => petSchema.omit({ name: true }))

export type UpdatePetStatus200SchemaXmlType = z.infer<typeof updatePetStatus200SchemaXml>

export const updatePetStatus200Schema = z.union([updatePetStatus200SchemaJson, updatePetStatus200SchemaXml])

export type UpdatePetStatus200SchemaType = z.infer<typeof updatePetStatus200Schema>

export const updatePetStatus202Schema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [10] }),
})

export type UpdatePetStatus202SchemaType = z.infer<typeof updatePetStatus202Schema>

export const updatePetStatus400Schema = z.unknown()

export type UpdatePetStatus400SchemaType = z.infer<typeof updatePetStatus400Schema>

export const updatePetStatus404Schema = z.unknown()

export type UpdatePetStatus404SchemaType = z.infer<typeof updatePetStatus404Schema>

export const updatePetStatus405Schema = z.unknown()

export type UpdatePetStatus405SchemaType = z.infer<typeof updatePetStatus405Schema>

export const updatePetResponseSchema = z.union([updatePetStatus200Schema, updatePetStatus202Schema])

export type UpdatePetResponseSchemaType = z.infer<typeof updatePetResponseSchema>

export const updatePetErrorSchema = z.union([updatePetStatus400Schema, updatePetStatus404Schema, updatePetStatus405Schema])

export type UpdatePetErrorSchemaType = z.infer<typeof updatePetErrorSchema>

export const updatePetBodySchemaJson = z.lazy(() => petSchema.omit({ id: true })).describe('Update an existent pet in the store')

export type UpdatePetBodySchemaJsonType = z.infer<typeof updatePetBodySchemaJson>

export const updatePetBodySchemaXml = z.lazy(() => petSchema.omit({ id: true })).describe('Update an existent pet in the store')

export type UpdatePetBodySchemaXmlType = z.infer<typeof updatePetBodySchemaXml>

export const updatePetBodySchemaFormUrlEncoded = z.lazy(() => petSchema.omit({ id: true })).describe('Update an existent pet in the store')

export type UpdatePetBodySchemaFormUrlEncodedType = z.infer<typeof updatePetBodySchemaFormUrlEncoded>

export const updatePetBodySchema = z.union([updatePetBodySchemaJson, updatePetBodySchemaXml, updatePetBodySchemaFormUrlEncoded])

export type UpdatePetBodySchemaType = z.infer<typeof updatePetBodySchema>
