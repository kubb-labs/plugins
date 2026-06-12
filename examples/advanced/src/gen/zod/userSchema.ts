import * as z from 'zod'
import { categorySchema } from './categorySchema.ts'

export const userSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  uuid: z.uuid().optional(),
  tag: categorySchema.optional().describe('The active tag'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.int().optional().describe('User Status'),
})

export type UserSchemaType = z.infer<typeof userSchema>
