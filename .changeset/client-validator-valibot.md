---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Accept `'valibot'` in the `validator` option, next to `'zod'`. The client then validates with the schemas of `@kubb/plugin-valibot`.

```ts
export default defineConfig({
  plugins: [pluginTs(), pluginValibot(), pluginFetch({ validator: { request: 'valibot', params: 'valibot', response: 'valibot' } })],
})
```

`@kubb/plugin-zod` and `@kubb/plugin-valibot` are now optional peer dependencies of `@kubb/plugin-client`, so it no longer installs them for you. Install the one your `validator` names.
