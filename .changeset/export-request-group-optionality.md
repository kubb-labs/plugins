---
'@kubb/plugin-client': minor
---

Export `getRequestGroupOptionality` and the `RequestGroupOptionality` and `RequestGroups` types from `@kubb/plugin-client`. A custom generator that wraps generated calls can use it to tell whether an operation's grouped `options` argument is required, optional, or carries no request group, with the same rule the generated client uses.
