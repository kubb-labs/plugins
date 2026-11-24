---
'@kubb/plugin-react-query': patch
---

Stop generated query hooks from writing `queryKey` onto the TanStack Query result, which could loop until React threw `Maximum update depth exceeded` on `@tanstack/react-query` 5.107 and later.
