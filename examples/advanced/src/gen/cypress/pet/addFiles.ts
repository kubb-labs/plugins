import type { Pet } from '../../models/ts/Pet'

type AddFilesStatus200 = Omit<NonNullable<Pet>, 'name'>

export function addFiles(
  {
    body,
  }: Pick<
    | {
        body: {
          url: string
        }
        path?: never
        query?: never
        headers?: never
        contentType?:
          | 'application/json'
          | {
              request: 'application/json'
            }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'multipart/form-data'
          | {
              request: 'multipart/form-data'
            }
      },
    'body'
  >,
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<AddFilesStatus200> {
  return cy
    .request<AddFilesStatus200>({
      method: 'POST',
      url: `/pet/files`,
      body,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<AddFilesStatus200>
}
