---
'@kubb/plugin-msw': patch
---

Fail the run with a clear error when `parser: 'faker'` is set but `@kubb/plugin-faker` is not registered. Before, the handlers silently returned `JSON.stringify(data)` instead of faker data.
