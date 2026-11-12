---
'@kubb/plugin-client': minor
---

Add the `returnType` option to `@kubb/plugin-client`. Set it to `'full'` to wrap generated operations in `withUnwrap` from your `importPath` module, so callers can use `.unwrap()`, or to `'data'` to resolve to the body. The default stays `'plain'`.
