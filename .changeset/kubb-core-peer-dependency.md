---
"@kubb/plugin-axios": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-fetch": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-redoc": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-zod": minor
---

Add `@kubb/core` as a `peerDependency`, alongside its existing `dependencies` entry, matching the pattern used by Vite and Vue plugin ecosystems. Plugins run against a single shared `@kubb/core` instance owned by the host CLI, so a mismatched version risks `instanceof` errors and other subtle bugs across plugin boundaries. The peer range signals that constraint to package managers, while keeping `@kubb/core` in `dependencies` too keeps install working out of the box across npm, Yarn, and pnpm without requiring consumers to install `@kubb/core` themselves.
