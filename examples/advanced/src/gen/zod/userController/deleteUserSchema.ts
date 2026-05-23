import * as z from 'zod'

export const deleteUserPathUsernameSchema = z.string().describe('The name that needs to be deleted')

export type DeleteUserPathUsernameSchema = z.infer<typeof deleteUserPathUsernameSchema>
