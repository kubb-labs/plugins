import { createQueryTemplate } from './createQueryGenerator.tsx'

/**
 * Built-in template for `useQuery` hooks. Emits one `useFooQuery` hook per
 * GET and QUERY operation (configurable via `query.methods`) plus the matching
 * `fooQueryKey` / `fooQueryOptions` helpers.
 */
export const queryOperation = createQueryTemplate({ variant: 'query' })
