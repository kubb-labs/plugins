import * as z from 'zod'
import { petSchema } from '../petSchema'

export const getPetByIdPathPetIdSchema = z.int().describe('ID of pet to return')

export type GetPetByIdPathPetIdSchemaType = z.infer<typeof getPetByIdPathPetIdSchema>

export const getPetByIdStatus200SchemaJson = z.lazy(() => petSchema.omit({ name: true }))

export type GetPetByIdStatus200SchemaJsonType = z.infer<typeof getPetByIdStatus200SchemaJson>

export const getPetByIdStatus200SchemaXml = z.lazy(() => petSchema.omit({ name: true }))

export type GetPetByIdStatus200SchemaXmlType = z.infer<typeof getPetByIdStatus200SchemaXml>

export const getPetByIdStatus200Schema = z.union([getPetByIdStatus200SchemaJson, getPetByIdStatus200SchemaXml])

export type GetPetByIdStatus200SchemaType = z.infer<typeof getPetByIdStatus200Schema>

export const getPetByIdStatus400Schema = z.unknown()

export type GetPetByIdStatus400SchemaType = z.infer<typeof getPetByIdStatus400Schema>

export const getPetByIdStatus404Schema = z.unknown()

export type GetPetByIdStatus404SchemaType = z.infer<typeof getPetByIdStatus404Schema>

export const getPetByIdResponseSchema = getPetByIdStatus200Schema

export type GetPetByIdResponseSchemaType = z.infer<typeof getPetByIdResponseSchema>

export const getPetByIdErrorSchema = z.union([getPetByIdStatus400Schema, getPetByIdStatus404Schema])

export type GetPetByIdErrorSchemaType = z.infer<typeof getPetByIdErrorSchema>

export const getPetByIdPathSchema = z.object({
  petId: z.int().describe('ID of pet to return'),
})

export type GetPetByIdPathSchemaType = z.infer<typeof getPetByIdPathSchema>

export const getPetByIdOptionsSchema = z.object({
  body: z.never().optional(),
  path: getPetByIdPathSchema,
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type GetPetByIdOptionsSchemaType = z.infer<typeof getPetByIdOptionsSchema>
