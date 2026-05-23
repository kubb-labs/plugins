import * as z from 'zod'

export const findPetsByStatusPathStepIdSchema = z.string()

export type FindPetsByStatusPathStepIdSchema = z.infer<typeof findPetsByStatusPathStepIdSchema>
