import type { PetEvent } from '../../models/ts/PetEvent'

export function streamPetEvents(
  {
    path,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: never
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<PetEvent> {
  return cy
    .request<PetEvent>({
      method: 'GET',
      url: `/pet/${path.petId}/events`,
      ...options,
    })
    .then((res) => res.body)
}
