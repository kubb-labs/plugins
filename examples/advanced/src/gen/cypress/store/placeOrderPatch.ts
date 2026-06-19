import type { PlaceOrderPatchRequestConfig, PlaceOrderPatchResponse } from '../../models/ts/store/PlaceOrderPatch.ts'

export function placeOrderPatch(
  { body }: Omit<PlaceOrderPatchRequestConfig, 'url'>,
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
