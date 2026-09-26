---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix `sdk.mode: 'tag'` silently collapsing every tag into one class when `output.mode: 'file'`. The generator now throws `KUBB_INVALID_PLUGIN_OPTIONS` instead of merging every tag's operations into whichever controller is built first.

Set `sdk.mode: 'flat'` to emit one class into that file, or give `output.path` an extensionless directory name (or set `output.mode: 'directory'` explicitly) so each tag gets its own file.
