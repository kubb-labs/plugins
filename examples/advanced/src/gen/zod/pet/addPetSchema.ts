import * as z from 'zod'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'

export const addPetStatus405Schema = z.object({
  code: z.int().optional(),
  message: z.string().optional(),
})

export type AddPetStatus405SchemaType = z.infer<typeof addPetStatus405Schema>

export const addPetStatusDefaultSchemaJson = z.lazy(() => petSchema.omit({ name: true }))

export type AddPetStatusDefaultSchemaJsonType = z.infer<typeof addPetStatusDefaultSchemaJson>

export const addPetStatusDefaultSchemaXml = z.lazy(() => petSchema.omit({ name: true }))

export type AddPetStatusDefaultSchemaXmlType = z.infer<typeof addPetStatusDefaultSchemaXml>

export const addPetStatusDefaultSchema = z.union([addPetStatusDefaultSchemaJson, addPetStatusDefaultSchemaXml])

export type AddPetStatusDefaultSchemaType = z.infer<typeof addPetStatusDefaultSchema>

export const addPetResponseSchema = z.union([addPetStatus405Schema, addPetStatusDefaultSchema])

export type AddPetResponseSchemaType = z.infer<typeof addPetResponseSchema>

export const addPetDataSchemaJson = addPetRequestSchema.describe('Create a new pet in the store')

export type AddPetDataSchemaJsonType = z.infer<typeof addPetDataSchemaJson>

export const addPetDataSchemaXml = z.lazy(() => petSchema.omit({ id: true })).describe('Create a new pet in the store')

export type AddPetDataSchemaXmlType = z.infer<typeof addPetDataSchemaXml>

export const addPetDataSchemaFormUrlEncoded = z.lazy(() => petSchema.omit({ id: true })).describe('Create a new pet in the store')

export type AddPetDataSchemaFormUrlEncodedType = z.infer<typeof addPetDataSchemaFormUrlEncoded>

export const addPetDataSchema = z.union([addPetDataSchemaJson, addPetDataSchemaXml, addPetDataSchemaFormUrlEncoded])

export type AddPetDataSchemaType = z.infer<typeof addPetDataSchema>
