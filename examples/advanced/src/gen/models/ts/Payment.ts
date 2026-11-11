import type { PaymentMethodEnumKey } from './PaymentMethodEnum'

/**
 * @description A payment for a store order
 * @see http://swagger.io Payment model
 * @type object
 */
export type Payment = {
  id: number
  method?: PaymentMethodEnumKey
  creditCard?: string
  billingAddress?: string
  labels?: Array<string>
  /**
   * @description The error of the last failed attempt, as a JSON document
   * @type string | undefined
   */
  lastError?: string
  signature?: string
}
