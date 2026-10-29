---
'@kubb/plugin-react-query': patch
---

An operation whose `override` sets `query: false` no longer gets a `HookOptions` entry for a query hook that was never generated.
