---
'@kubb/plugin-redoc': patch
---

Read the OpenAPI document from any adapter, instead of only `adapterOas`. The plugin checks that the adapter's document is an OpenAPI 3 or Swagger 2 document and still fails with `KUBB_ADAPTER_REQUIRED` when it isn't. `@kubb/adapter-oas` is no longer a peer dependency.
