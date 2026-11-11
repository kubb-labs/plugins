---
'@kubb/plugin-msw': minor
---

Add the `responseBody` option to replace the response body of an operation's handler and `…Response<status>` helpers, such as a stream in a custom framing. Return `undefined` to keep the default `JSON.stringify(data)` body.

```ts
pluginMsw({
  responseBody: ({ node, status }) =>
    node.extensions?.['x-acme-streaming'] && status === 200
      ? { imports: [{ name: ['encodeStream'], path: '@acme/runtime' }], expression: (data) => `encodeStream(${data})` }
      : undefined,
})
```
