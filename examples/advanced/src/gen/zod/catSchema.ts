import * as z from 'zod'

export const catSchema = z.strictObject({
  type: z.string().min(1),
  name: z.string().optional(),
  indoor: z.boolean(),
})

export type CatSchemaType = z.infer<typeof catSchema>
