---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Setup now throws a clear error when the registered `@kubb/plugin-fetch` or `@kubb/plugin-axios`
predates the `unwrap()` method these hooks call, instead of generating hooks that fail at runtime.

```
`@kubb/plugin-fetch` is registered at version 5.1.2, but this plugin needs `@kubb/plugin-fetch@5.2.0` or newer.
Generated hooks call `unwrap()` on the client's result, which `@kubb/plugin-fetch` only added in 5.2.0.
Upgrade `@kubb/plugin-fetch` to 5.2.0 or later.
```

Upgrade `@kubb/plugin-fetch` or `@kubb/plugin-axios` to `5.2.0` or later to clear the error.
