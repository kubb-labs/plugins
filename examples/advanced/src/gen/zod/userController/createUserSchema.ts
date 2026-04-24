import * as z from 'zod'
import { userSchema } from '../userSchema.ts'

export const createUserStatusDefaultSchema = userSchema

export type CreateUserStatusDefaultSchema = z.infer<typeof createUserStatusDefaultSchema>

export const createUserResponseSchema = createUserStatusDefaultSchema

export type CreateUserResponseSchema = z.infer<typeof createUserResponseSchema>
