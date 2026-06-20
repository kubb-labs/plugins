import type { UploadFileRequestConfig, UploadFileResponse } from '../../models/ts/pet/UploadFile.ts'

export function uploadFile(
  { path, query, body }: UploadFileRequestConfig,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UploadFileResponse> {
  return cy
    .request<UploadFileResponse>({
      method: 'POST',
      url: `/pet/${path.petId}/uploadImage`,
      qs: query,
      body,
      ...options,
    })
    .then((res) => res.body)
}
