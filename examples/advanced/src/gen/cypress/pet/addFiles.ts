import type { AddFilesOptions, AddFilesResponse } from '../../models/ts/pet/AddFiles.ts'

export function addFiles({ body }: AddFilesOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<AddFilesResponse> {
  return cy
    .request<AddFilesResponse>({
      method: 'POST',
      url: `/pet/files`,
      body,
      ...options,
    })
    .then((res) => res.body)
}
