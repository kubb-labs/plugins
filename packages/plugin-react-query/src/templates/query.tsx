import { createQueryTemplate } from './createQuery.tsx'

/**
 * Built-in template for `useQuery` hooks. Emits one `useFoo` hook per
 * GET and QUERY operation (configurable via `query.methods`) plus the matching
 * `fooQueryKey` / `fooQueryOptions` helpers.
 */
export const queryOperation = createQueryTemplate({ variant: 'query' })
