---
"@kubb/plugin-zod": minor
---

Add a `regexType` option that picks how an OpenAPI `pattern` is emitted inside `.regex(...)`. `'literal'` (the default) keeps the current regex literal `.regex(/^[a-z]+$/)`, and `'constructor'` emits `.regex(new RegExp("^[a-z]+$"))`. The constructor form helps when a regex literal trips up your toolchain or you need the pattern as a string. Both the chainable and `zod/mini` printers honor it.
