import * as z from 'zod'

export const createPetsQueryBoolParamSchema = z.literal(true).optional()

export type CreatePetsQueryBoolParamSchema = z.infer<typeof createPetsQueryBoolParamSchema>

export const createPetsPathUuidSchema = z.string().describe('UUID')

export type CreatePetsPathUuidSchema = z.infer<typeof createPetsPathUuidSchema>

export const createPetsQueryOffsetSchema = z.int().optional().describe('Offset */')

export type CreatePetsQueryOffsetSchema = z.infer<typeof createPetsQueryOffsetSchema>

export const createPetsHeaderXEXAMPLESchema = z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters')

export type CreatePetsHeaderXEXAMPLESchema = z.infer<typeof createPetsHeaderXEXAMPLESchema>

export const createPetsDataSchema = z.object({
  name: z.string(),
  tag: z.string(),
})

export type CreatePetsDataSchema = z.infer<typeof createPetsDataSchema>
