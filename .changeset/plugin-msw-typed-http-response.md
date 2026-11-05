---
'@kubb/plugin-msw': patch
---

Generate `new HttpResponse<string>(...)` in response factories and handlers. With MSW 3, the untyped call inferred `HttpResponse<DefaultBodyType>`, which `msw/http` does not export, so declaration emit failed with TS2883.
