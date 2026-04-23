import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsData,
  CreatePetsResponse,
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsHeaderXEXAMPLE,
} from '../../../models/ts/petsController/CreatePets.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPets } from '../../axios/petsService/createPets.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

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
