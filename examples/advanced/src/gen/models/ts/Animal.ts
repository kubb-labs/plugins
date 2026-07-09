import type { AnimalTypeEnumKey } from './AnimalTypeEnum'
import type { Cat } from './Cat'
import type { Dog } from './Dog'

export type Animal = (
  | (Cat & {
      /**
       * @type string
       */
      readonly type: 'cat'
    })
  | (Dog & {
      /**
       * @type string
       */
      readonly type: 'dog'
    })
) & {
  readonly type: AnimalTypeEnumKey
}
