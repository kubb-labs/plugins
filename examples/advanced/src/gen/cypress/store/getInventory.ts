export function getInventory(options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<{
  [key: string]: number
}> {
  return cy
    .request<{
      [key: string]: number
    }>({
      method: 'GET',
      url: `/store/inventory`,
      ...options,
    })
    .then((res) => res.body)
}
