import type { ApiResponse } from '../../models/ts/ApiResponse'

export function uploadFile(
  {
    path,
    query,
    body,
  }: {
    body: Blob
    path: {
      petId: number
    }
    query?: {
      additionalMetadata?: string
    }
    headers?: never
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<ApiResponse> {
  return cy
    .request<ApiResponse>({
      method: 'POST',
      url: `/pet/${path.petId}/uploadImage`,
      qs: query,
      body,
      ...options,
    })
    .then((res) => res.body)
}
