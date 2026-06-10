import * as z from 'zod'
import { categorySchema } from '../categorySchema.ts'

export const tagTagSchema = categorySchema

export type TagTagSchemaType = z.infer<typeof tagTagSchema>
