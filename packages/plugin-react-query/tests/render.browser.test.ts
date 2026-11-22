import { QueryClient, QueryClientProvider, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { createElement, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { useFindPetsByTagsInfinite } from '../src/generators/__snapshots__/findByTags/useFindPetsByTagsInfinite.ts'

const queryFn = async () => {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return [{ id: 1 }]
}
const select = (data: { pages: Array<unknown> }) => data.pages.flat()

const clients: Array<QueryClient> = []
const roots: Array<ReturnType<typeof createRoot>> = []

afterEach(() => {
  roots.splice(0).forEach((root) => root.unmount())
  clients.splice(0).forEach((client) => client.clear())
  document.body.replaceChildren()
})

test.each([
  { kind: 'direct', readResult: false },
  { kind: 'generated', readResult: false },
  { kind: 'direct', readResult: true },
  { kind: 'generated', readResult: true },
])('$kind hook survives mounting and sibling state updates (readResult: $readResult)', async ({ kind, readResult }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)

  function GeneratedHook({ tag }: { tag: string }) {
    const result = useFindPetsByTagsInfinite(
      { query: { tags: [tag] } },
      { query: { queryFn, select: (data) => select(data), placeholderData: keepPreviousData } },
    )
    if (!readResult) return null
    return createElement('span', null, result.isSuccess ? 'Loaded' : 'Loading')
  }

  function DirectHook({ tag }: { tag: string }) {
    const result = useInfiniteQuery({
      queryKey: ['direct', tag],
      queryFn,
      initialPageParam: 0,
      getNextPageParam: () => undefined,
      select: (data) => select(data),
      placeholderData: keepPreviousData,
    })
    if (!readResult) return null
    return createElement('span', null, result.isSuccess ? 'Loaded' : 'Loading')
  }

  function Counter() {
    const [count, setCount] = useState(0)
    const [tag, setTag] = useState('cat')
    return createElement(
      'div',
      null,
      createElement('output', { 'aria-label': 'counter' }, String(count)),
      createElement('button', { onClick: () => setCount((value) => value + 1) }, 'Bump'),
      createElement('button', { onClick: () => setTag('dog') }, 'Change query'),
      createElement(kind === 'generated' ? GeneratedHook : DirectHook, { tag }),
    )
  }

  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  root.render(createElement(QueryClientProvider, { client }, createElement(Counter)))

  await expect.poll(() => client.getQueryCache().getAll()[0]?.state.status).toBe('success')
  for (let count = 1; count <= 3; count++) {
    await page.getByRole('button', { name: 'Bump' }).click()
    await expect.element(page.getByLabelText('counter')).toHaveTextContent(String(count))
    if (readResult) await expect.element(page.getByText('Loaded', { exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Change query' }).click()
  await expect.poll(() => client.getQueryCache().getAll().length).toBe(2)
  await expect
    .poll(() =>
      client
        .getQueryCache()
        .getAll()
        .every((query) => query.state.status === 'success'),
    )
    .toBe(true)
  await page.getByRole('button', { name: 'Bump' }).click()
  await expect.element(page.getByLabelText('counter')).toHaveTextContent('4')
})
