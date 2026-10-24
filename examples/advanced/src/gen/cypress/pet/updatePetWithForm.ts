export function updatePetWithForm(
  {
    path,
    query,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: {
      name?: string
      status?: string
    }
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<unknown> {
  return cy
    .request<unknown>({
      method: 'POST',
      url: `/pet/${path.petId}:search`,
      qs: query,
      ...options,
    })
    .then((res) => res.body)
}
