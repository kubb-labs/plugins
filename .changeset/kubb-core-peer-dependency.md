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

Move `@kubb/core` from `dependencies` to `peerDependencies`, matching the existing `@kubb/renderer-jsx` peer setup and the pattern used by Vite/Vue plugin ecosystems. Plugins run against a single shared `@kubb/core` instance owned by the host CLI, so bundling a second copy risks version drift and `instanceof` mismatches across plugin boundaries. Consumers now resolve `@kubb/core` against the version installed alongside `kubb` instead of each plugin pulling in its own copy.
