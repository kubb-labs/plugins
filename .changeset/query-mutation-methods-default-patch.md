---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
---

Correct the documented `mutation.methods` default so the JSDoc matches the runtime. The query plugins already treat `patch` as a mutation method, so the default reads `['post', 'put', 'patch', 'delete']`.
