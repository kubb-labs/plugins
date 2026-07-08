---
"@kubb/plugin-ts": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-mcp": patch
---

Restore grouped query/path/header parameter types in `plugin-ts`, fixing kubb-labs/plugins#632.

**`plugin-ts`**: query, path, and header parameters are grouped back into a single named type per
operation (`LoginUserQuery`, `LoginUserPath`, `LoginUserHeaders`), matching v4's `LoginUserQueryParams`
behavior instead of exploding every parameter into its own top-level type
(`LoginUserQueryUsername`, `LoginUserQueryPassword`, ...). Each grouped type keeps the original
parameter's JSDoc (`@description`, `@type`, ...), and is referenced by name from the operation's
grouped request-options type, which is renamed from `RequestConfig` to `Options` (`LoginUserOptions`)
to stop overlapping with the runtime client's own `RequestConfig` type. The request body type is
similarly renamed from `Data` to `Body` (`CreatePetBody`) to match its field name in `Options`.

Downstream client and hook generators (`plugin-fetch`, `plugin-axios`, `plugin-react-query`,
`plugin-vue-query`, `plugin-swr`, `plugin-cypress`, `plugin-mcp`) pick up the renamed `Options` type
automatically.

**`plugin-faker`**: mock factories for query/path/header parameters are now generated per group
(`createLoginUserQuery()`) instead of per individual parameter, matching the grouped types above.
This also fixes a latent bug where multiple parameters in the same group collided on the same
generated mock function name and imported a type that no longer resolved to that single parameter.
