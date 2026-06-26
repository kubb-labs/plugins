---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Serialize path, query, header, and cookie parameters plus urlencoded bodies by their `style` / `explode`, and fix array and object path params rendering as `[object Object]`.

```ts
defaultPathSerializer({ name: 'id', value: [3, 4, 5] }) // '3,4,5'
defaultPathSerializer({ name: 'id', value: [3, 4, 5], options: { style: 'matrix', explode: true } }) // ';id=3;id=4;id=5'
defaultQuerySerializer({ id: [3, 4, 5] }, { id: { style: 'pipeDelimited', explode: false } }) // 'id=3|4|5'
serializeCookies({ ids: [1, 2] }) // 'ids=1,2'
```

A request carries the per-parameter metadata in `pathStyles` / `queryStyles` / `headerStyles` / `cookieStyles` / `bodyEncoding`. Params without metadata keep the previous defaults, so existing output is unchanged.

Breaking: `querySerializer` and `bodySerializer` move under one `serializer` object.

```ts
- client({ querySerializer, bodySerializer })
+ client({ serializer: { query: querySerializer, body: bodySerializer, path: pathSerializer } })
```
