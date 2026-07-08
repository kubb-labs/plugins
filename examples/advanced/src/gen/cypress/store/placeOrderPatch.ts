import type { PlaceOrderPatchOptions, PlaceOrderPatchResponse } from '../../models/ts/store/PlaceOrderPatch.ts'

export function placeOrderPatch({ body }: PlaceOrderPatchOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<PlaceOrderPatchResponse> {
  return cy
    .request<PlaceOrderPatchResponse>({
      method: 'PATCH',
      url: `/store/order`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
