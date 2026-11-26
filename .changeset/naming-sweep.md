---
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-ky': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-redoc': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-valibot': patch
'@kubb/plugin-zod': patch
---

Name each plugin's options types after the plugin, such as `PluginFetchOptions` and `PluginZodResolvedOptions`. The old names keep working until v6:

| Package | Deprecated | Use instead |
| --- | --- | --- |
| `@kubb/plugin-client` | `Options`, `ResolvedOptions` | `PluginClientOptions`, `PluginClientResolvedOptions` |
| `@kubb/plugin-axios`, `@kubb/plugin-fetch`, `@kubb/plugin-ky` | `Options` | `PluginAxiosOptions`, `PluginFetchOptions`, `PluginKyOptions` |
| `@kubb/plugin-axios`, `@kubb/plugin-fetch`, `@kubb/plugin-ky` | `ResolvedOptions` | `ClientResolvedOptions` |
| `@kubb/plugin-react-query`, `@kubb/plugin-swr`, `@kubb/plugin-vue-query` | `Transformer` | `KeyTransformer` |
