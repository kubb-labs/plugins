export const createPetsXEXAMPLEEnum = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsXEXAMPLEEnumKey = (typeof createPetsXEXAMPLEEnum)[keyof typeof createPetsXEXAMPLEEnum]
