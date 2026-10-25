import type { CreatePetsBoolParamKey } from '../../models/ts/CreatePetsBoolParam'
import type { CreatePetsXEXAMPLEKey } from '../../models/ts/CreatePetsXEXAMPLE'

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
      bool_param?: CreatePetsBoolParamKey
      offset?: number
    }
    headers: {
      'X-EXAMPLE': CreatePetsXEXAMPLEKey
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
    .then((res) => res.body)
}
