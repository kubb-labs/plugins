---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

With `returnType: 'full'`, hooks no longer import the unused success status type (such as `GetPetLimitsStatus200`) when the operation declares response headers. The import broke builds that enable `noUnusedLocals`.
