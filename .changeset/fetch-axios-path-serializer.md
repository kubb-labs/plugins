---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Serialize path, query, header, and cookie parameters plus urlencoded bodies by their `style` / `explode`, and fix array and object path params rendering as `[object Object]`. The generator reads each parameter's `style` / `explode` straight from the OpenAPI document and emits it on the call, so the right serialization applies without extra configuration (needs `@kubb/core` 5.0.0-beta.76 or later).

```ts
defaultPathSerializer({ name: 'id', value: [3, 4, 5] }) // '3,4,5'
defaultPathSerializer({ name: 'id', value: [3, 4, 5], options: { style: 'matrix', explode: true } }) // ';id=3;id=4;id=5'
defaultQuerySerializer({ id: [3, 4, 5] }, { id: { style: 'pipeDelimited', explode: false } }) // 'id=3|4|5'
serializeCookies({ ids: [1, 2] }) // 'ids=1,2'
```

A request carries the per-parameter metadata under one `styles` object (`{ path, query, header, cookie, body }`), mirroring the `serializer` grouping. Params without metadata keep the previous defaults, so existing output is unchanged.

The default serializers now live in their own `.kubb/serializers.ts`, emitted next to `.kubb/client.ts`, which imports them. Override a serializer through the `serializer` option as before.

Breaking: `querySerializer` and `bodySerializer` move under one `serializer` object.

```ts
- client({ querySerializer, bodySerializer })
+ client({ serializer: { query: querySerializer, body: bodySerializer, path: pathSerializer } })
```
