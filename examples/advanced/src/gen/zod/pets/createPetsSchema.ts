import * as z from 'zod'
import { createPetsXEXAMPLEEnumSchema } from '../createPetsXEXAMPLEEnumSchema'

export const createPetsQueryBoolParamSchema = z.literal(true).optional()

export type CreatePetsQueryBoolParamSchemaType = z.infer<typeof createPetsQueryBoolParamSchema>

/**
 * UUID
 */
export const createPetsPathUuidSchema = z.string().describe('UUID')

export type CreatePetsPathUuidSchemaType = z.infer<typeof createPetsPathUuidSchema>

/**
 * Offset * /
 */
export const createPetsQueryOffsetSchema = z.int().optional().describe('Offset */')

export type CreatePetsQueryOffsetSchemaType = z.infer<typeof createPetsQueryOffsetSchema>

export const createPetsHeaderXEXAMPLESchema = createPetsXEXAMPLEEnumSchema.describe('Header parameters')

export type CreatePetsHeaderXEXAMPLESchemaType = z.infer<typeof createPetsHeaderXEXAMPLESchema>

export const createPetsStatus201Schema = z.unknown()

export type CreatePetsStatus201SchemaType = z.infer<typeof createPetsStatus201Schema>

/**
 * Pet not found
 */
export const createPetsStatusDefaultSchema = z.unknown().describe('Pet not found')

export type CreatePetsStatusDefaultSchemaType = z.infer<typeof createPetsStatusDefaultSchema>

export const createPetsResponseSchema = createPetsStatus201Schema

export type CreatePetsResponseSchemaType = z.infer<typeof createPetsResponseSchema>

export const createPetsErrorSchema = createPetsStatusDefaultSchema

export type CreatePetsErrorSchemaType = z.infer<typeof createPetsErrorSchema>

export const createPetsBodySchema = z.object({
  name: z.string(),
  tag: z.string(),
})

export type CreatePetsBodySchemaType = z.infer<typeof createPetsBodySchema>

export const createPetsPathSchema = z.object({
  uuid: createPetsPathUuidSchema,
})

export type CreatePetsPathSchemaType = z.infer<typeof createPetsPathSchema>

export const createPetsQuerySchema = z.object({
  bool_param: createPetsQueryBoolParamSchema,
  offset: createPetsQueryOffsetSchema,
})

export type CreatePetsQuerySchemaType = z.infer<typeof createPetsQuerySchema>

export const createPetsHeadersSchema = z.object({
  'X-EXAMPLE': createPetsHeaderXEXAMPLESchema,
})

export type CreatePetsHeadersSchemaType = z.infer<typeof createPetsHeadersSchema>

export const createPetsOptionsSchema = z.object({
  body: createPetsBodySchema,
  path: createPetsPathSchema,
  query: createPetsQuerySchema.optional(),
  headers: createPetsHeadersSchema,
})

export type CreatePetsOptionsSchemaType = z.infer<typeof createPetsOptionsSchema>

export const createPetsResponsesSchema = z.object({
  '201': createPetsStatus201Schema,
  default: createPetsStatusDefaultSchema,
})

export type CreatePetsResponsesSchemaType = z.infer<typeof createPetsResponsesSchema>
