// version: 1.0.11

export const findPetsByStatusStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type FindPetsByStatusStatusKey = (typeof findPetsByStatusStatus)[keyof typeof findPetsByStatusStatus]
