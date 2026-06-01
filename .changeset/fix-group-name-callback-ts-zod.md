---
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
---

Honor a user-provided `group.name` callback in `pluginTs` and `pluginZod`. Both plugins ignored the callback and always fell back to the default `${camelCase(tag)}Controller` naming, unlike every other plugin. The `honorName` flag on the shared `createGroupConfig` helper that caused this discrepancy has been removed so a user-provided `group.name` always wins.
