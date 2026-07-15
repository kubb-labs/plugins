import * as z from 'zod'
import { addPetRequestSchema } from '../addPetRequestSchema'
import { petSchema } from '../petSchema'

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

export const addPetResponseSchema = z.unknown()

export type AddPetResponseSchemaType = z.infer<typeof addPetResponseSchema>

export const addPetErrorSchema = z.union([addPetStatus405Schema, addPetStatusDefaultSchema])

export type AddPetErrorSchemaType = z.infer<typeof addPetErrorSchema>

export const addPetBodySchemaJson = addPetRequestSchema.describe('Create a new pet in the store')

export type AddPetBodySchemaJsonType = z.infer<typeof addPetBodySchemaJson>

export const addPetBodySchemaXml = z.lazy(() => petSchema.omit({ id: true })).describe('Create a new pet in the store')

export type AddPetBodySchemaXmlType = z.infer<typeof addPetBodySchemaXml>

export const addPetBodySchemaFormUrlEncoded = z.lazy(() => petSchema.omit({ id: true })).describe('Create a new pet in the store')

export type AddPetBodySchemaFormUrlEncodedType = z.infer<typeof addPetBodySchemaFormUrlEncoded>

export const addPetBodySchema = z.union([addPetBodySchemaJson, addPetBodySchemaXml, addPetBodySchemaFormUrlEncoded])

export type AddPetBodySchemaType = z.infer<typeof addPetBodySchema>

export const addPetOptionsSchema = z.object({
  body: addPetBodySchema,
  path: z.never().optional(),
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type AddPetOptionsSchemaType = z.infer<typeof addPetOptionsSchema>
