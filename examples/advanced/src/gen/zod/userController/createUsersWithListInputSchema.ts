import * as z from 'zod'
import { userSchema } from '../userSchema.ts'

export const createUsersWithListInputDataSchema = z.array(userSchema).optional()

export type CreateUsersWithListInputDataSchema = z.infer<typeof createUsersWithListInputDataSchema>
