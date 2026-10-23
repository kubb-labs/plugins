---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
---

Remove the setup checks that threw `KUBB_INVALID_PLUGIN_OPTIONS` when an option such as `returnType`, `syntaxType`, or `parser` held a value outside its allowed list. The option types already reject those values. Checks that depend on another option, such as `sdk.mode: 'tag'` with single-file output, still throw.
