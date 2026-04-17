---
"@kubb/plugin-msw": major
---

**Breaking:** Upgrade `@kubb/plugin-msw` to the v5 plugin architecture.

- Remove the `@kubb/plugin-oas` and `@kubb/oas` runtime dependency from the plugin
- Move `contentType` filtering to `adapterOas(...)`
- Keep existing MSW options like `handlers`, `parser`, `baseURL`, `group`, `include`, `exclude`, `override`, and `transformers.name`
- Add `resolver`, `transformer`, and `generators` options for v5 customization
- Export `resolverMsw` from `@kubb/plugin-msw`
