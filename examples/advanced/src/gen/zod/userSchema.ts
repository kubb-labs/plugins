import * as z from 'zod'
import { categorySchema } from './categorySchema.ts'

export const userSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [10] }),
  username: z
    .string()
    .optional()
    .meta({ examples: ['theUser'] }),
  uuid: z.uuid().optional(),
  tag: categorySchema.optional().describe('The active tag'),
  firstName: z
    .string()
    .optional()
    .meta({ examples: ['John'] }),
  lastName: z
    .string()
    .optional()
    .meta({ examples: ['James'] }),
  email: z
    .email()
    .optional()
    .meta({ examples: ['john@email.com'] }),
  password: z
    .string()
    .optional()
    .meta({ examples: ['12345'] }),
  phone: z
    .string()
    .optional()
    .meta({ examples: ['12345'] }),
  userStatus: z
    .int()
    .optional()
    .describe('User Status')
    .meta({ examples: [1] }),
})

export type UserSchemaType = z.infer<typeof userSchema>
