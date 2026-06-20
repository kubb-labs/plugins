import type { PlaceOrderPatchRequestConfig, PlaceOrderPatchResponse } from '../../models/ts/store/PlaceOrderPatch.ts'

export function placeOrderPatch(
  { body }: PlaceOrderPatchRequestConfig,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<PlaceOrderPatchResponse> {
  return cy
    .request<PlaceOrderPatchResponse>({
      method: 'PATCH',
      url: `/store/order`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
