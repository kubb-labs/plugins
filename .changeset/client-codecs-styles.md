---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Rename two client config options so they no longer collide with each other.

The per-content-type `bodySerializers` and `deserializers` maps merge into one `codecs` map, keyed by content type, where each entry holds a `serialize` and a `deserialize` function. This removes the overlap with the single `serializer.body` function and pairs request encoding with response decoding per media type.

```ts
// before
client.setConfig({
  bodySerializers: { 'application/xml': (body) => build(body) },
  deserializers: { 'application/xml': (raw) => parse(raw) },
})

// after
client.setConfig({
  codecs: {
    'application/xml': { serialize: (body) => build(body), deserialize: (raw) => parse(raw) },
  },
})
```

The per-parameter `serialization` metadata (the OpenAPI `style` / `explode` config a generated operation carries, and the per-call override) is renamed to `styles`, so it no longer reads like the `serializer` functions. The generated operations now emit a `styles:` entry instead of `serialization:`.

```ts
// before
await listPets({ query: { tags }, serialization: { query: { tags: { style: 'pipeDelimited', explode: false } } } })

// after
await listPets({ query: { tags }, styles: { query: { tags: { style: 'pipeDelimited', explode: false } } } })
```
