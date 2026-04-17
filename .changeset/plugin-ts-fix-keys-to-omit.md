---
"@kubb/plugin-ts": patch
---

Fix `keysToOmit` not being forwarded to the `Type` component, causing write-only/read-only field omission to be silently ignored.
