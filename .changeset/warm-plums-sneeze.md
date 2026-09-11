---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

`RequestConfig`'s `path`, `headers`, and `cookies` fields no longer require an index signature.
With `pluginTs({ syntaxType: 'interface' })`, the generated per-operation `Path`/`Headers`/
`Cookies` types are `interface`s, which TypeScript never gives an implicit index signature (unlike
a `type` alias), so passing one to the generated client failed to typecheck (`TS2345`). These
fields now accept `unknown`, the same treatment `query` already had.
