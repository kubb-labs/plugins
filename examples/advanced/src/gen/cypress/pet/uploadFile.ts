import type { ApiResponse } from '../../models/ts/ApiResponse.ts'
import type { UploadFileRequestConfig } from '../../models/ts/pet/UploadFile.ts'

export function uploadFile({ path, query, body }: UploadFileRequestConfig, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<ApiResponse> {
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
