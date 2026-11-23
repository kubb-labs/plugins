import { createQueryTemplate } from './createQuery.tsx'

/**
 * Built-in template for `useInfiniteQuery` hooks, enabled by `infinite` with `hooks: true`. Emits one
 * `useFooInfiniteQuery` hook per query operation, paged with the configured `nextParam` and `previousParam`.
 */
export const infiniteQueryOperation = createQueryTemplate({ variant: 'infiniteQuery' })
