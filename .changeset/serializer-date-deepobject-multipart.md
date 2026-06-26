---
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
---

Serialize `Date` values as ISO-8601 across path, query, cookie, and header parameters, recurse into nested objects for the `deepObject` query style, and apply a per-part content type from `multipart/form-data` encoding.

```ts
defaultPathSerializer({ name: 'since', value: new Date('2020-01-02T03:04:05.000Z') }) // '2020-01-02T03%3A04%3A05.000Z'
defaultQuerySerializer({ a: { b: { c: 1 } } }, { a: { style: 'deepObject' } }) // 'a%5Bb%5D%5Bc%5D=1'
defaultBodySerializer({ body: { meta: { a: 1 } }, contentType: 'multipart/form-data', encoding: { meta: { contentType: 'application/json' } } }) // FormData with a typed Blob part
```
