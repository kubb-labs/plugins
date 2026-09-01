---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Every generated call now resolves to a promise with an extra `unwrap()` method: it resolves to the
bare success body, or rejects with `error` for a call that didn't throw. `await getPetById(...)`
still returns the full result as before, so this is additive.
