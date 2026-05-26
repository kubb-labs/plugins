import * as z from 'zod'
import { categorySchema } from '../categorySchema.ts'

export const tagTagSchema = categorySchema

export type TagTagSchema = z.infer<typeof tagTagSchema>
