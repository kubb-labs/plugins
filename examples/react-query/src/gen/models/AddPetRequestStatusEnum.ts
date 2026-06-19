// version: 1.0.11

export const addPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatusEnumKey = (typeof addPetRequestStatusEnum)[keyof typeof addPetRequestStatusEnum]
