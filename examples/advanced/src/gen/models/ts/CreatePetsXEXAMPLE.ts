export const createPetsXEXAMPLE = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsXEXAMPLEKey = (typeof createPetsXEXAMPLE)[keyof typeof createPetsXEXAMPLE]
