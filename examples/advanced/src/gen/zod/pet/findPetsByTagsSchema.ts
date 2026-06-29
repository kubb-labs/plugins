import * as z from 'zod'
import { findPetsByTagsXEXAMPLESchema } from '../findPetsByTagsXEXAMPLESchema.ts'
import { petSchema } from '../petSchema.ts'

export const findPetsByTagsQueryTagsSchema = z.array(z.string()).optional().describe('Tags to filter by')

export type FindPetsByTagsQueryTagsSchemaType = z.infer<typeof findPetsByTagsQueryTagsSchema>

export const findPetsByTagsQueryPageSchema = z.string().optional().describe('to request with required page number or pagination')

export type FindPetsByTagsQueryPageSchemaType = z.infer<typeof findPetsByTagsQueryPageSchema>

export const findPetsByTagsQueryPageSizeSchema = z.number().optional().describe('to request with required page size')

export type FindPetsByTagsQueryPageSizeSchemaType = z.infer<typeof findPetsByTagsQueryPageSizeSchema>

export const findPetsByTagsHeaderXEXAMPLESchema = findPetsByTagsXEXAMPLESchema.describe('Header parameters')

export type FindPetsByTagsHeaderXEXAMPLESchemaType = z.infer<typeof findPetsByTagsHeaderXEXAMPLESchema>

export const findPetsByTagsStatus200SchemaJson = z.array(z.lazy(() => petSchema))

export type FindPetsByTagsStatus200SchemaJsonType = z.infer<typeof findPetsByTagsStatus200SchemaJson>

export const findPetsByTagsStatus200SchemaXml = z.array(z.lazy(() => petSchema))

export type FindPetsByTagsStatus200SchemaXmlType = z.infer<typeof findPetsByTagsStatus200SchemaXml>

export const findPetsByTagsStatus200Schema = z.union([findPetsByTagsStatus200SchemaJson, findPetsByTagsStatus200SchemaXml])

export type FindPetsByTagsStatus200SchemaType = z.infer<typeof findPetsByTagsStatus200Schema>

export const findPetsByTagsStatus400Schema = z.unknown()

export type FindPetsByTagsStatus400SchemaType = z.infer<typeof findPetsByTagsStatus400Schema>

export const findPetsByTagsResponseSchema = findPetsByTagsStatus200Schema

export type FindPetsByTagsResponseSchemaType = z.infer<typeof findPetsByTagsResponseSchema>

export const findPetsByTagsErrorSchema = findPetsByTagsStatus400Schema

export type FindPetsByTagsErrorSchemaType = z.infer<typeof findPetsByTagsErrorSchema>
