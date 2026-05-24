---
"@kubb/plugin-client": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-mcp": minor
---

Forward per-file context to `output.banner`/`output.footer` so a directive like `'use server'` can be skipped on re-export files.

Every generator now passes the file it renders into (`filePath`, `baseName`) to the banner/footer resolver, and the grouped client generator (`@kubb/plugin-client`) flags its group `[dir]/[dir].ts` files as `isAggregation`. Combined with the `BannerMeta` context added in `@kubb/core`, a banner function can branch per file:

```ts
pluginClient({
  output: {
    banner: (meta) => (meta.isBarrel || meta.isAggregation ? '' : "'use server'"),
  },
})
```

Requires `@kubb/core` with `BannerMeta` per-file banner context.
