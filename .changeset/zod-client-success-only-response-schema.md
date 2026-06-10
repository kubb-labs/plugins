---
"@kubb/plugin-zod": patch
"@kubb/plugin-client": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
---

Fix `parser: 'zod'` in client and query plugins using the full response union (including error shapes) to parse and narrow the return type of generated fetchers. Each operation now generates a `*SuccessResponseSchema` export in the zod schema file that unions only the 2xx responses, and generated fetchers import and use that schema instead of the all-status union. The broader `*ResponseSchema` is still exported for cases where callers need it.
