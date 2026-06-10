import type { AddFilesData, AddFilesResponse } from '../../models/ts/pet/AddFiles.ts'

export function addFiles(data: AddFilesData, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<AddFilesResponse> {
  return cy
    .request<AddFilesResponse>({
      method: 'POST',
      url: `/pet/files`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
