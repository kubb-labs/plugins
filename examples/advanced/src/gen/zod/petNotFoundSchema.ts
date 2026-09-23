import * as z from 'zod'

export const petNotFoundSchema = z.object({
  code: z.int32().optional(),
  message: z.string().optional(),
})

export type PetNotFoundSchemaType = z.infer<typeof petNotFoundSchema>
