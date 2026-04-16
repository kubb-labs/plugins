---
"@kubb/plugin-ts": major
---

**Breaking:** Replace `legacy` option with `compatibilityPreset`:

- `'none'` (default) — v5 naming conventions
- `'kubbV4'` — full v4 type-generation naming compatibility

Resolver precedence: base resolver from preset, then explicit `resolver` overrides.
