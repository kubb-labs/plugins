---
'@kubb/plugin-fetch': patch
---

Type the request of the default fetch transport with the fetch `ResolvedRequest`, so its `options.next` is the Next.js init and not a stand-in. The transport did not type-check on its own.
