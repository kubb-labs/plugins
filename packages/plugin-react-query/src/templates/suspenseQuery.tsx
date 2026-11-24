import { createQueryTemplate } from './createQuery.tsx'

/**
 * Built-in template for `useSuspenseQuery` hooks. Enabled when
 * `pluginReactQuery({ suspense: {}, hooks: true })`. Emits one
 * `useFooSuspense` hook per query operation. Suspense queries throw
 * promises while loading and require a `<Suspense>` boundary in the React
 * tree. TanStack Query v5+ only.
 */
export const suspenseQueryOperation = createQueryTemplate({ variant: 'suspenseQuery' })
