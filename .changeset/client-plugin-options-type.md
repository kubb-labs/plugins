---
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
---

Type the `pluginAxios` and `pluginFetch` options in the published declarations. They were typed as `any`, so callbacks in the options lost their types, for example `group: { name: ({ group }) => … }` failed under `noImplicitAny`.
