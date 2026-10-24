export function deletePet(
  {
    path,
    headers,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: never
    headers?: {
      api_key?: string
    }
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<unknown> {
  return cy
    .request<unknown>({
      method: 'DELETE',
      url: `/pet/${path.petId}:search`,
      headers,
      ...options,
    })
    .then((res) => res.body)
}
