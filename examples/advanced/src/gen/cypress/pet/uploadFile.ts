import type { UploadFileRequestConfig, UploadFileResponse } from '../../models/ts/pet/UploadFile.ts'

export function uploadFile(
  { path, query, body }: Omit<UploadFileRequestConfig, 'url'>,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UploadFileResponse> {
  const { petId } = path

  return cy
    .request<UploadFileResponse>({
      method: 'POST',
      url: `/pet/${petId}/uploadImage`,
      qs: query,
      body,
      ...options,
    })
    .then((res) => res.body)
}
