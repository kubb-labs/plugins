---
'@kubb/plugin-ts': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
---

Correct the `hooks` and `enum.type` doc comments so they match the defaults the plugins apply: `hooks` is off unless set to `true`, and `enum.type` stays `'asConst'`.
