import type { StreamPetEventsRequestConfig, StreamPetEventsResponse } from '../../models/ts/stream/StreamPetEvents.ts'

export function streamPetEvents(
  { path }: StreamPetEventsRequestConfig,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<StreamPetEventsResponse> {
  return cy
    .request<StreamPetEventsResponse>({
      method: 'GET',
      url: `/pet/${path.petId}/events`,
      ...options,
    })
    .then((res) => res.body)
}
