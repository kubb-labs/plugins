import * as z from 'zod'

export const categorySchema = z.object({
  id: z.bigint().optional(),
  name: z.string().optional(),
})

export type CategorySchema = z.infer<typeof categorySchema>
