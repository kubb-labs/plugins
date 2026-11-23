import { createQueryTemplate } from './createQuery.tsx'

/**
 * Built-in template for `useSuspenseInfiniteQuery` hooks. Enabled when
 * `suspense`, `infinite`, and `hooks` are all configured. Combines suspense
 * semantics with cursor-based pagination. Handlers throw promises while
 * loading and pull additional pages on demand.
 */
export const suspenseInfiniteQueryOperation = createQueryTemplate({ variant: 'suspenseInfiniteQuery' })
