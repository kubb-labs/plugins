---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-redoc": patch
"@kubb/plugin-zod": patch
---

Adopt native Node 22 features and drop the `remeda` and `handlebars` dependencies. The query and mutation generators now resolve their HTTP methods through a `Set` instead of `remeda`'s `difference`, `plugin-ts` sorts imports and exports with `Array.prototype.toSorted` and a local numeric guard, and `plugin-redoc` builds its HTML page from a native template literal instead of compiling a `handlebars` template at runtime. The shared TypeScript config moves to an ES2024 target with the ES2025 collection and iterator libraries.
