---
"@kubb/plugin-faker": patch
---

Fix potential Remote Code Execution in identifier validation.

Replace `new Function()` usage in `isValidStrictIdentifier` with a safe regex check combined with a reserved-word allowlist. This eliminates the RCE attack surface without changing any observable behaviour.
