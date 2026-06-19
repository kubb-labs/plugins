import type { UploadFilePathPetId, UploadFileQueryAdditionalMetadata, UploadFileData, UploadFileResponse } from '../../models/ts/pet/UploadFile.ts'

export function uploadFile(
  { petId, data, params }: { petId: UploadFilePathPetId; data: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<UploadFileResponse> {
  return cy
    .request<UploadFileResponse>({
      method: 'POST',
      url: `/pet/${petId}/uploadImage`,
      qs: params,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
