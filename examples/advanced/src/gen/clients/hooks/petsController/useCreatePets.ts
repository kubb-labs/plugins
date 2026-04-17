import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type { Client, RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsResponse,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPets } from '../../axios/petsService/createPets.ts'

export const createPetsMutationKey = () => [{ url: '/pets/:uuid' }] as const

export function createPetsMutationOptions<TContext = unknown>(config: Partial<RequestConfig<CreatePetsData>> & { client?: Client } = {}) {
  const mutationKey = createPetsMutationKey()
  return mutationOptions<
    ResponseConfig<CreatePetsResponse>,
    ResponseErrorConfig<Error>,
    {
      uuid: CreatePetsPathUuid
      data: CreatePetsData
      headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }
      params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset }
    },
    TContext
  >({
    mutationKey,
    mutationFn: async ({ uuid, data, headers, params }) => {
      return createPets({ uuid, data, headers, params }, config)
    },
  })
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function useCreatePets<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreatePetsResponse>,
      ResponseErrorConfig<Error>,
      {
        uuid: CreatePetsPathUuid
        data: CreatePetsData
        headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }
        params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset }
      },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreatePetsData>> & { client?: Client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPetsMutationKey()

  const baseOptions = createPetsMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreatePetsResponse>,
    ResponseErrorConfig<Error>,
    {
      uuid: CreatePetsPathUuid
      data: CreatePetsData
      headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }
      params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset }
    },
    TContext
  >

  return useMutation<
    ResponseConfig<CreatePetsResponse>,
    ResponseErrorConfig<Error>,
    {
      uuid: CreatePetsPathUuid
      data: CreatePetsData
      headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }
      params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset }
    },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreatePetsResponse>,
    ResponseErrorConfig<Error>,
    {
      uuid: CreatePetsPathUuid
      data: CreatePetsData
      headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }
      params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset }
    },
    TContext
  >
}
