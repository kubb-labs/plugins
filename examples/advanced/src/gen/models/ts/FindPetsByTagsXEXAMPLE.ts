export const findPetsByTagsXEXAMPLE = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type FindPetsByTagsXEXAMPLEKey = (typeof findPetsByTagsXEXAMPLE)[keyof typeof findPetsByTagsXEXAMPLE]
