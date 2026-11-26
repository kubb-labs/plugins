import type { CreatePetsXEXAMPLEEnumKey } from '../../models/ts/CreatePetsXEXAMPLEEnum'

export function createPets(
  {
    path,
    query,
    body,
    headers,
  }: {
    body: {
      name: string
      tag: string
    }
    path: {
      uuid: string
    }
    query?: {
      bool_param?: true
      offset?: number
    }
    headers: {
      'X-EXAMPLE': CreatePetsXEXAMPLEEnumKey
    }
  },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<unknown> {
  return cy
    .request<unknown>({
      method: 'POST',
      url: `/pets/${path.uuid}`,
      qs: query,
      headers,
      body,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<unknown>
}
