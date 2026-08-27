---
'@kubb/plugin-zod': patch
---

Keep an array `default` as an array literal instead of collapsing it to `{}`.

`formatDefault` branched on `typeof value === 'object'`, which is also true for an array, so a
`default: []` reached through a `$ref` was emitted as `.default({})`. `defaultLiteral` only guarded
this for nodes that narrow to `array`, and a property referencing an array schema is a ref node, so
it fell through and produced `z.array(...).default({})` — a schema that does not typecheck.
