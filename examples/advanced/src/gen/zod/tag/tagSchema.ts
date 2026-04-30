import * as z from 'zod'

export const tagTagSchema = z.object({
  id: z.bigint().optional().default(1),
  name: z.string().optional(),
})

export type TagTagSchema = z.infer<typeof tagTagSchema>
