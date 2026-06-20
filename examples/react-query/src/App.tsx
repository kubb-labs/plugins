import { QueryClient, QueryClientProvider, useQueries } from '@tanstack/react-query'
import { useState } from 'react'
import { findPetsByStatusQueryOptionsHook, useFindPetsByStatusHook, useFindPetsByTagsInfiniteHook, useUpdatePetWithFormHook } from './gen/hooks/index.ts'
import type { FindPetsByStatusQueryStatus, Pet } from './gen/models'

const queryClient = new QueryClient()

function Pets() {
  const [status, setStatus] = useState<FindPetsByStatusQueryStatus>('available')
  const { data: pets, queryKey } = useFindPetsByStatusHook({ query: { status } }, { query: { enabled: true } })
  const { data } = useUpdatePetWithFormHook({ path: { petId: 2 } })
  const { queryKey: _queryKey, initialData } = findPetsByStatusQueryOptionsHook()
  const statuses: Array<FindPetsByStatusQueryStatus> = ['available', 'pending']

  const queries = useQueries({
    queries: statuses.map((status) => findPetsByStatusQueryOptionsHook({ query: { status } })),
  })

  console.log(data)
  //            ^?

  console.log(pets)
  //            ^?

  console.log(initialData)
  //            ^?

  console.log(queryKey)
  //            ^?

  console.log(_queryKey)
  //            ^?

  console.log(queries)
  //            ^?

  const { data: firstPet, queryKey: firstQueryKey } = useFindPetsByStatusHook(
    { query: { status: 'available' } },
    {
      query: {
        queryKey: ['test'] as const,
        enabled: false,
        select: (data) => {
          const res = data[0]
          //    ^?
          return res
        },
      },
    },
  )
  const { data: _pagedPets } = useFindPetsByTagsInfiniteHook(
    {},
    {
      query: {
        getNextPageParam: (_lastPage, pages) => {
          const nextPage = pages.length + 1
          return nextPage <= 3 ? nextPage : undefined
        },
      },
    },
  )

  const { data: _pagedPet } = useFindPetsByTagsInfiniteHook(
    {},
    {
      query: {
        getNextPageParam: (_lastPage, pages) => {
          const nextPage = pages.length + 1
          return nextPage <= 3 ? nextPage : undefined
        },
        // select(data) {
        //   return data.pages[0]?.data.at(0)
        // },
      },
    },
  )

  // console.log(pagedPets?.pages.at(0)?.data.at(0)?.id)
  //            ^?
  // console.log(pagedPet?.id)
  //            ^?
  console.log(firstPet)
  //            ^?

  console.log(firstQueryKey)
  //            ^?

  return (
    <>
      <h1>Pets: {status}</h1>
      <ul>
        {(pets as Array<Pet> | undefined)?.map((pet) => (
          <li key={pet.id}>{pet.name}</li>
        ))}
      </ul>
      <button type="button" onClick={() => setStatus('available')}>
        Available
      </button>
      <button type="button" onClick={() => setStatus('pending')}>
        Pending
      </button>
    </>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Pets />
    </QueryClientProvider>
  )
}
