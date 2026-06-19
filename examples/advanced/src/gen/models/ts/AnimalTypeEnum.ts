export const animalTypeEnum = {
  cat: 'cat',
  dog: 'dog',
} as const

export type AnimalTypeEnumKey = (typeof animalTypeEnum)[keyof typeof animalTypeEnum]
