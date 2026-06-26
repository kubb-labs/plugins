import * as z from 'zod'

export const createPetsBoolParamSchema = z.literal(true)

export type CreatePetsBoolParamSchemaType = z.infer<typeof createPetsBoolParamSchema>
