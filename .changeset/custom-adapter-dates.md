---
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
---

Allow custom adapters with `@kubb/plugin-zod` and `@kubb/plugin-valibot`. Generation no longer fails with `KUBB_ADAPTER_REQUIRED` when the adapter is not `adapterOas`.

Both printers now read offset and local date-times only from the `offset` and `local` flags on the `datetime` node, which `adapterOas` already sets from `dateType`. The `dateType` option of `printerZod` and `printerValibot` is removed. If you call a printer directly, set `offset: true` or `local: true` on the node instead.
