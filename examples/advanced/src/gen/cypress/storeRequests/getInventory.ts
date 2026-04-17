import type { GetInventoryResponse } from '../../models/ts/storeController/GetInventory.ts'

export function getInventory(options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetInventoryResponse> {
  return cy
    .request<GetInventoryResponse>({
      method: 'GET',
      url: '/store/inventory',
      ...options,
    })
    .then((res) => res.body)
}
