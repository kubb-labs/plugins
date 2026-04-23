import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const addFilesStatus200Schema = petSchema.omit({ name: true })

export type AddFilesStatus200Schema = z.infer<typeof addFilesStatus200Schema>

export const addFilesStatus405Schema = z.any()

export type AddFilesStatus405Schema = z.infer<typeof addFilesStatus405Schema>

export const addFilesResponseSchema = z.union([addFilesStatus200Schema, addFilesStatus405Schema])

export type AddFilesResponseSchema = z.infer<typeof addFilesResponseSchema>

export const addFilesDataSchema = petSchema.omit({ id: true })

export type AddFilesDataSchema = z.infer<typeof addFilesDataSchema>
