import * as z from 'zod'

export const categorySchema = z.object({
  id: z.int().optional(),
  name: z.string().optional(),
})

export type CategorySchemaType = z.infer<typeof categorySchema>
