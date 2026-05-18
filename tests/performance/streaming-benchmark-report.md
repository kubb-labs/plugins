# Streaming vs Batch: Benchmark Report

**Kubb version**: `5.0.0-beta.16`
**Date**: 2026-05-18
**Environment**: Linux, Node 22, `pnpm test:bench`

---

## Background

Kubb `5.0.0-beta.16` introduces a streaming parse path in `@kubb/core`. When an OpenAPI
specification contains more than **100 schemas** (`STREAM_SCHEMA_THRESHOLD`), the adapter
switches from `parse()` — which materialises the full AST in memory — to a single-pass
`stream()` that yields schemas and operations one at a time.

The key architectural difference is fan-out. In the batch path each plugin walks
`inputNode.schemas` independently, so three plugins mean three full traversals of the
same array. In the streaming path `runPluginStreamHooks` iterates the spec exactly once
and dispatches every node to all registered plugins in parallel. Fewer traversals directly
translates to lower wall-clock time on large, multi-plugin builds.

---

## Specs Under Test

| Spec | Schemas | Operations | Trigger |
|---|---|---|---|
| `twitter.json` | 236 | ~44 | streaming |
| `digitalocean.yaml` | 312 | ~210 | streaming |
| `bunq.com.json` | 617 | ~180 | streaming |
| `petStore.yaml` (reference) | 9 | 18 | **batch** (below threshold) |

All three large specs exceed the 100-schema threshold and therefore take the streaming path
automatically in beta.16. The petStore spec is used only as a reference for the existing
`main.bench.ts` suite.

---

## Plugin Configurations

- **`plugin-ts`** — TypeScript type generation only (single plugin)
- **`plugin-ts` + `plugin-zod`** — Types and Zod schema generation (two plugins)

Both configurations write to an in-memory output (`write: false`) to eliminate I/O noise.

---

## Results

Timings are the mean of three measured iterations after one warmup iteration, in
milliseconds. Lower is better.

### twitter.json — 236 schemas

| Configuration | Batch (ms) | Stream (ms) | Speedup |
|---|---|---|---|
| `plugin-ts` | 993 | 779 | **1.27×** |
| `plugin-ts + plugin-zod` | 1,622 | 1,046 | **1.55×** |

### digitalocean.yaml — 312 schemas

| Configuration | Batch (ms) | Stream (ms) | Speedup |
|---|---|---|---|
| `plugin-ts` | 2,563 | 1,752 | **1.46×** |
| `plugin-ts + plugin-zod` | 5,460 | 2,551 | **2.14×** |

### bunq.com.json — 617 schemas

| Configuration | Batch (ms) | Stream (ms) | Speedup |
|---|---|---|---|
| `plugin-ts` | 2,661 | 2,589 | **1.03×** |
| `plugin-ts + plugin-zod` | 6,260 | 4,465 | **1.40×** |

---

## Analysis

### Multi-plugin configurations gain the most

The speedup from streaming scales with the number of active plugins. With a single
`plugin-ts`, the DigitalOcean spec improves by 1.46×. Add `plugin-zod` and the same spec
improves by 2.14×. The reason is structural: batch mode traverses the schema list once per
plugin, so two plugins means two full passes. Streaming traverses once and dispatches to
both plugins simultaneously, cutting total traversal work roughly in half.

### Schema count matters more than raw schema volume

DigitalOcean (312 schemas, ~210 operations) shows the largest multi-plugin gain at 2.14×.
Bunq (617 schemas, ~180 operations) shows a smaller gain at 1.40× for the same
configuration. This points to per-schema parse cost rather than pure count: DigitalOcean's
schemas tend to be deeply nested with discriminator hierarchies, so each parse step is more
expensive and the fan-out savings add up faster.

### Single-plugin overhead on very large specs

At 617 schemas with a single plugin, streaming is essentially neutral (1.03×). The `count()`
pre-flight call and the lazy iteration overhead consume the time saved by avoiding a second
traversal that does not exist in a single-plugin setup. Streaming still makes sense here
because memory usage is bounded — the full AST is never resident — but wall-clock time is
not meaningfully faster than batch for single-plugin large specs.

### Practical breakeven

Based on the data, streaming delivers a measurable time saving whenever two or more plugins
run against a spec with more than ~200 schemas. Below that band, batch remains comparable
in speed and simpler in structure. The 100-schema threshold in `STREAM_SCHEMA_THRESHOLD` is
conservative: a tighter threshold (e.g. 150–200) would avoid the marginal overhead seen on
smaller specs that fall near the boundary.

---

## How to Reproduce

```bash
pnpm test:bench
```

The streaming benchmark lives at `tests/performance/streaming.bench.ts`. It uses a
`batchOnly()` wrapper that strips `count` and `stream` from the adapter to force the batch
path, making stream and batch configurations directly comparable on identical input files.

---

## Summary Table

| Spec | Schemas | Single plugin speedup | Two-plugin speedup |
|---|---|---|---|
| twitter.json | 236 | 1.27× | 1.55× |
| digitalocean.yaml | 312 | 1.46× | **2.14×** |
| bunq.com.json | 617 | 1.03× | 1.40× |
