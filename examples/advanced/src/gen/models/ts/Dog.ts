import type { Image } from './Image'

/**
 * @type object
 */
export type Dog = {
  /**
   * @minLength 1
   * @type string
   */
  readonly type: string
  /**
   * @type string
   */
  name: string
  /**
   * @example linode/debian10
   * @type string | undefined
   */
  readonly image?: Image | null
}
