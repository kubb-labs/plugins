import type {
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsData,
  CreatePetsResponse,
} from '../../models/ts/petsController/CreatePets.ts'

export function createPets(
  uuid: CreatePetsPathUuid,
  data: CreatePetsData,
  headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE },
  params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset },
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<CreatePetsResponse> {
  return cy
    .request<CreatePetsResponse>({
      method: 'POST',
      url: `/pets/${uuid}`,
      qs: params ? { bool_param: params.boolParam, offset: params.offset } : undefined,
      headers: headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
