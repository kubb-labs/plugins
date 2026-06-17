import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileResponse } from '../../models/ts/pet/UploadFile.ts'

export function uploadFile(
  petId: UploadFilePathPetId,
  params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UploadFileResponse> {
  return cy
    .request<UploadFileResponse>({
      method: 'POST',
      url: `/pet/${petId}/uploadImage`,
      qs: params,
      ...options,
    })
    .then((res) => res.body)
}
