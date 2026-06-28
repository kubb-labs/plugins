import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const findPetsByStatusPathStepIdSchema = z.string()

export type FindPetsByStatusPathStepIdSchemaType = z.infer<typeof findPetsByStatusPathStepIdSchema>

export const findPetsByStatusStatus200SchemaJson = z
  .array(z.lazy(() => petSchema))
  .min(1)
  .max(3)
  .refine((items) => new Set(items).size === items.length, { message: 'Array entries must be unique' })

export type FindPetsByStatusStatus200SchemaJsonType = z.infer<typeof findPetsByStatusStatus200SchemaJson>

export const findPetsByStatusStatus200SchemaXml = z.array(z.lazy(() => petSchema))

export type FindPetsByStatusStatus200SchemaXmlType = z.infer<typeof findPetsByStatusStatus200SchemaXml>

export const findPetsByStatusStatus200Schema = z.union([findPetsByStatusStatus200SchemaJson, findPetsByStatusStatus200SchemaXml])

export type FindPetsByStatusStatus200SchemaType = z.infer<typeof findPetsByStatusStatus200Schema>

export const findPetsByStatusStatus400Schema = z.unknown()

export type FindPetsByStatusStatus400SchemaType = z.infer<typeof findPetsByStatusStatus400Schema>

export const findPetsByStatusResponseSchema = findPetsByStatusStatus200Schema

export type FindPetsByStatusResponseSchemaType = z.infer<typeof findPetsByStatusResponseSchema>

export const findPetsByStatusErrorSchema = findPetsByStatusStatus400Schema

export type FindPetsByStatusErrorSchemaType = z.infer<typeof findPetsByStatusErrorSchema>
