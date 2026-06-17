import * as z from 'zod'

export const categorySchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [1] }),
  name: z
    .string()
    .optional()
    .meta({ examples: ['Dogs'] }),
})

export type CategorySchemaType = z.infer<typeof categorySchema>
