export const petEventTypeEnum = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
} as const

export type PetEventTypeEnumKey = (typeof petEventTypeEnum)[keyof typeof petEventTypeEnum]
