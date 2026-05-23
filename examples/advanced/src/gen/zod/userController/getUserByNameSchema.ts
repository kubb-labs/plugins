import * as z from 'zod'

export const getUserByNamePathUsernameSchema = z.string().describe('The name that needs to be fetched. Use user1 for testing. ')

export type GetUserByNamePathUsernameSchema = z.infer<typeof getUserByNamePathUsernameSchema>
