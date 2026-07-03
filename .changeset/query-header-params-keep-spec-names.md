---
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
---

Send query and header parameters with the names the OpenAPI document declares (kubb-labs/plugins#631).

The generated types keep camelCase keys (`include_deleted` becomes `includeDeleted`), but the client used to serialize those camelCased keys straight onto the request, so an API expecting `include_deleted` or `X-API-Key` never received them. Generated clients and SDK methods now remap the keys back to the spec names before the request goes out:

```ts
return request({ method: 'POST', url: '/pets/{petId}', ...config, query: config.query ? { "include_deleted": config.query.includeDeleted } : config.query })
```

The remap is only emitted for operations where a name actually changes. Path parameters were already correct, since the URL template placeholders are renamed in sync with the `path` keys. Per-parameter `styles` for query, header, and cookie are now keyed by the spec name to match the serialized keys.
