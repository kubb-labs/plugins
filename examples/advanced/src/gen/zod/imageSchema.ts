import * as z from 'zod'

export const imageSchema = z
  .string()
  .nullable()
  .meta({ examples: ['linode/debian10'] })

export type ImageSchemaType = z.infer<typeof imageSchema>
