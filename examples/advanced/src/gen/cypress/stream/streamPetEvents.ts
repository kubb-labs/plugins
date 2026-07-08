import type { StreamPetEventsOptions, StreamPetEventsResponse } from '../../models/ts/stream/StreamPetEvents.ts'

export function streamPetEvents({ path }: StreamPetEventsOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<StreamPetEventsResponse> {
  return cy
    .request<StreamPetEventsResponse>({
      method: 'GET',
      url: `/pet/${path.petId}/events`,
      ...options,
    })
    .then((res) => res.body)
}
