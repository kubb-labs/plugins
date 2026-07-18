---
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
---

Cache a dependency plugin's resolved name and file per operation node, reported in kubb-labs/kubb#3813.

A dependent used to call `driver.getResolver(dep)` and re-resolve the dependency's name and path for every node. `plugin-react-query`'s query, mutation, and infinite-query generators each recomputed `plugin-ts`'s and the contract client's file for the same operation, and `plugin-swr`, `plugin-vue-query`, `plugin-mcp`, `plugin-msw`, `plugin-faker`, and `plugin-cypress` each recomputed `plugin-ts`'s file independently.

`resolveClientOperation` (`@internals/client`) and the new `resolveDependencyOperationFile` (`@internals/shared`) now read and write the current node's shared cache (`ctx.cache`, from kubb-labs/kubb#3812), so the first plugin that resolves a dependency for a node computes it once and every other plugin generating from that same node reuses the result. The contract client's own generator (`plugin-fetch`/`plugin-axios`) populates the cache first, so its dependents usually hit it directly. Generated output is unchanged.
