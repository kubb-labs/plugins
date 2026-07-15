import type { Image } from './Image'

export type Dog = {
  /**
   * @minLength 1
   * @type string
   */
  readonly type: string
  name: string
  /**
   * @example linode/debian10
   * @type string | undefined
   */
  readonly image?: Image | null
}
