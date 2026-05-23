import * as z from 'zod'

export const addFilesDataSchema = z.object({
  url: z.url().describe('URL of the image to upload'),
})

export type AddFilesDataSchema = z.infer<typeof addFilesDataSchema>
