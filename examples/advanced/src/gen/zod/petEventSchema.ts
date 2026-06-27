import * as z from 'zod'
import { petEventTypeEnumSchema } from './petEventTypeEnumSchema.ts'
import { petSchema } from './petSchema.ts'

export const petEventSchema = z.object({
  type: petEventTypeEnumSchema.describe('The kind of change that occurred'),
  get pet() {
    return petSchema
  },
  timestamp: z.iso.datetime().optional(),
})

export type PetEventSchemaType = z.infer<typeof petEventSchema>
