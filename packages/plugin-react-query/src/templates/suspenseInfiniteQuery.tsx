import { createQueryTemplate } from './createQuery.tsx'

/**
 * Built-in template for `useSuspenseInfiniteQuery` hooks, enabled when `suspense`, `infinite` and `hooks`
 * are all set. Emits one hook per query operation.
 */
export const suspenseInfiniteQueryOperation = createQueryTemplate({ variant: 'suspenseInfiniteQuery' })
