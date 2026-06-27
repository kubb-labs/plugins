import * as z from 'zod'

export const petEventTypeEnumSchema = z.enum(['created', 'updated', 'deleted']).describe('The kind of change that occurred')

export type PetEventTypeEnumSchemaType = z.infer<typeof petEventTypeEnumSchema>
