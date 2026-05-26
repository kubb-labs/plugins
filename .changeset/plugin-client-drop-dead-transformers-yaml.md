---
"@kubb/plugin-client": patch
---

Remove the duplicate `transformers` option from the plugin-client extension YAML. The TypeScript option type only defines `transformer` (singular), so the duplicate was dead metadata that bloated the published registry. The `transformer` option itself is unchanged.
