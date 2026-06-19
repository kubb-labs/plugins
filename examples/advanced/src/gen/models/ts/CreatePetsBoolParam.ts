export const createPetsBoolParam = {
  true: true,
} as const

export type CreatePetsBoolParamKey = (typeof createPetsBoolParam)[keyof typeof createPetsBoolParam]
