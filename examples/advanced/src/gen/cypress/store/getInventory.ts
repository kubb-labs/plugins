type GetInventoryStatus200 = {
  [key: string]: number
}

export function getInventory(options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetInventoryStatus200> {
  return cy
    .request<GetInventoryStatus200>({
      method: 'GET',
      url: `/store/inventory`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<GetInventoryStatus200>
}
