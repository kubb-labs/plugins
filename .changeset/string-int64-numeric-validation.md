---
"@kubb/plugin-zod": patch
"@kubb/plugin-faker": patch
---

Treat a `type: 'string'` schema with an integer `format` as digits, reported in kubb-labs/kubb#3836.

`@kubb/adapter-oas` now keeps `{ type: 'string', format: 'int64' }` as a `string` node instead of turning it into a `bigint`, since ProtoJSON (and so every gRPC-gateway spec) encodes 64-bit integers as JSON strings. Those fields would have generated a bare `z.string()` and a `faker.string.alpha()` mock full of letters.

`plugin-zod` now falls back to a digits `.regex(...)` for the `int32`, `int64`, and `uint64` formats (`^-?\d+$`, or `^\d+$` for the unsigned one), and a `pattern` from the spec still wins. `plugin-faker` mocks the same fields with `faker.number.bigInt().toString()`, or `faker.number.int({ max: 2147483647 }).toString()` for `int32`.
