import * as z from 'zod'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'

export const addPetStatus405Schema = z.object({
  code: z.int().optional(),
  message: z.string().optional(),
})

export type AddPetStatus405Schema = z.infer<typeof addPetStatus405Schema>

export const addPetStatusDefaultSchemaJson = z.lazy(() => petSchema.omit({ name: true }))

export type AddPetStatusDefaultSchemaJson = z.infer<typeof addPetStatusDefaultSchemaJson>

export const addPetStatusDefaultSchemaXml = z.lazy(() => petSchema.omit({ name: true }))

export type AddPetStatusDefaultSchemaXml = z.infer<typeof addPetStatusDefaultSchemaXml>

export const addPetStatusDefaultSchema = z.union([addPetStatusDefaultSchemaJson, addPetStatusDefaultSchemaXml])

export type AddPetStatusDefaultSchema = z.infer<typeof addPetStatusDefaultSchema>

export const addPetResponseSchema = z.union([addPetStatus405Schema, addPetStatusDefaultSchema])

export type AddPetResponseSchema = z.infer<typeof addPetResponseSchema>

export const addPetDataSchemaJson = addPetRequestSchema.describe('Create a new pet in the store')

export type AddPetDataSchemaJson = z.infer<typeof addPetDataSchemaJson>

export const addPetDataSchemaXml = z.lazy(() => petSchema.omit({ id: true })).describe('Create a new pet in the store')

export type AddPetDataSchemaXml = z.infer<typeof addPetDataSchemaXml>

export const addPetDataSchemaFormUrlEncoded = z.lazy(() => petSchema.omit({ id: true })).describe('Create a new pet in the store')

export type AddPetDataSchemaFormUrlEncoded = z.infer<typeof addPetDataSchemaFormUrlEncoded>

export const addPetDataSchema = z.union([addPetDataSchemaJson, addPetDataSchemaXml, addPetDataSchemaFormUrlEncoded])

export type AddPetDataSchema = z.infer<typeof addPetDataSchema>
