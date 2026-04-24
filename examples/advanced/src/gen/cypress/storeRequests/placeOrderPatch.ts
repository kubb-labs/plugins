import type { PlaceOrderPatchResponse } from '../../models/ts/storeController/PlaceOrderPatch.ts'

export function placeOrderPatch(data?: PlaceOrderPatchData, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<PlaceOrderPatchResponse> {
  return cy
    .request<PlaceOrderPatchResponse>({
      method: 'PATCH',
      url: `/store/order`,
      ...options,
    })
    .then((res) => res.body)
}
