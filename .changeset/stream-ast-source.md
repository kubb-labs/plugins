---
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
---

Consume the new `Adapter.source` streaming view introduced in `@kubb/core` / `@kubb/adapter-oas`.

- `operations` generator hooks now receive an `AsyncIterable<OperationNode>`; first-party generators iterate it with `for await` and materialize only what they need.
- `plugin-ts` enum-name detection, `plugin-zod` / `plugin-faker` cyclic-schema detection, and `plugin-faker` ref resolution route through `adapter.source` when present, keeping the per-source result memoized and avoiding repeated full schema scans.
