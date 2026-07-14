---
"@kubb/plugin-ts": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-fetch": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-mcp": minor
---

Keep the OpenAPI document's exact parameter names for path, query, and header parameters, instead of forcing them to camelCase (kubb-labs/plugins#631).

```ts
export type UpdatePetQuery = {
  include_deleted?: boolean
}

updatePet({ path: { pet_id: '1' }, query: { include_deleted: true } })
```

There's no remapping step anymore, so a query or header name can't collide with a differently cased sibling, like `start_date` next to `startDate`.

A path parameter still falls back to camelCase when its spec name isn't a valid identifier on its own (a hyphenated segment, say), since a few generators bind it directly as a variable. Query and header names are never touched.
