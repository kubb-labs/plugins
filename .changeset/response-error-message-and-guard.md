---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

`ResponseError` names the request in its message and gains a `ResponseError.is` guard.

The message was only `Request failed with status 500`, so logs and test failures that print `error.message` could not tell which call failed. It now reads `GET https://api.example.com/pet/1 failed with status 404 Not Found`. The query string is left out, since an API key can be sent as a query parameter. A `ResponseError` constructed directly without `method` / `url` keeps the old message.

Every generated client bundles its own `ResponseError`, so `instanceof` fails for an error thrown by another client in the same app. `ResponseError.is(error)` matches on `name` instead:

```typescript
if (ResponseError.is(error) && error.status === 404) {
  // works for errors from any Kubb-generated client
}
```
