---
'@kubb/plugin-zod': minor
---

Add `inferred: 'direction'`, which types each alias from the side that matches how its schema is used. Request schemas (body, path, query, headers, the options object, and the `<name>InputSchema` variants) use `z.input`, the value a caller passes. Response and error schemas use `z.output`, the value a caller receives. With a codec such as `adapterOas({ dateType: 'date' })`, request and response types are then both the domain value. `inferred: true` keeps `z.infer` for every alias, as before.

To send those request values in their wire form, enable the client's `validator: { request: 'zod', params: 'zod' }`. For schemas without a codec, `z.input` and `z.output` are the same type.

The grouped `<operation>PathSchema`, `QuerySchema`, and `HeadersSchema` are now emitted for every operation with params in that group, not only with `inferred`, so a client's `validator.params` can run them with any `pluginZod` config.

```typescript
pluginZod({ inferred: 'direction' })

export type PutEventOptionsSchemaType = z.input<typeof putEventOptionsSchema> // { path: { day: Date }, body: { startsAt: Date } }
export type PutEventResponsesSchemaType = z.output<typeof putEventResponsesSchema> // { 200: { startsAt: Date } }
```
