---
"@kubb/plugin-ts": major
---

**Breaking:** Replace `legacy` option with `resolver`:

- Default — v5 naming conventions
- Use `resolver` option for custom naming

Resolver precedence: base resolver from preset, then explicit `resolver` overrides.
