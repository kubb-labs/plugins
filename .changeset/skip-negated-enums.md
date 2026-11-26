---
'@kubb/plugin-ts': patch
---

Stop emitting a runtime enum for values that appear only inside `not`. The generated type never used it, but the barrel still exported it.
