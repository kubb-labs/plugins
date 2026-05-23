import * as z from 'zod'
import { userSchema } from '../userSchema.ts'

export const createUserDataSchema = userSchema.optional().describe('Created user object')

export type CreateUserDataSchema = z.infer<typeof createUserDataSchema>
