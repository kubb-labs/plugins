---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

With `returnType: 'full'`, hooks no longer import the unused success status type, such as `GetPetLimitsStatus200`, which broke builds with `noUnusedLocals`.
