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

Generated types, function signatures, and request calls now use each parameter's spec name directly, matching how request body properties already work:

```ts
export type UpdatePetQuery = {
  include_deleted?: boolean
}

updatePet({ path: { pet_id: '1' }, query: { include_deleted: true } })
```

There is no more remapping step between the generated code and the request that goes out over the wire, so a query or header name can no longer collide with a differently cased sibling (for example `start_date` and `startDate` in the same location).

A path parameter still falls back to a camelCased form when its spec name is not a valid identifier on its own (a hyphenated path segment, for example), because a few generators bind it directly as a variable. Query and header parameter names are never transformed, since they only ever appear as object keys.
