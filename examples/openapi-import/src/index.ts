// The types come from `petStore.openapi.yaml` through `openapi-import`, with no generated files.
import type { FindPetsByStatusQuery, FindPetsByStatusResponse, GetPetByIdPath, GetPetByIdResponse, Pet } from '../petStore.openapi.yaml'

const baseUrl = 'https://petstore3.swagger.io/api/v3'

export async function findPetsByStatus(query: FindPetsByStatusQuery): Promise<FindPetsByStatusResponse> {
  const response = await fetch(`${baseUrl}/pet/findByStatus?${new URLSearchParams(query)}`)

  return response.json()
}

export async function getPetById({ petId }: GetPetByIdPath): Promise<GetPetByIdResponse> {
  const response = await fetch(`${baseUrl}/pet/${petId}`)

  return response.json()
}

export const pet: Pet = {
  name: 'Rex',
  photoUrls: [],
  status: 'available',
}

// @ts-expect-error `status` only accepts the values the spec lists
export const invalidPet: Pet = { name: 'Rex', photoUrls: [], status: 'lost' }
