---
'@kubb/plugin-msw': major
---

Generate handlers for MSW 3. The plugin now needs `msw@^3.0.0`.

- Imports `http`, `HttpResponse`, and `HttpResponseResolver` from `msw/http` instead of `msw`. MSW 3 deprecates these root exports and plans to remove them in its next major, and MSW 2 has no `msw/http` entry.
- Returns `HttpResponse` instead of the plain Fetch `Response`, so mocks use the MSW response class.

To upgrade, install MSW 3 and regenerate your handlers:

```sh
npm install msw@^3.0.0
```

MSW 3 is ESM-only and requires Node.js 22 or later. Code you wrote by hand that imports from `msw` needs the same move to subpaths, see the [MSW 2.x to 3.x migration guide](https://mswjs.io/docs/migrations/2.x-to-3.x).
