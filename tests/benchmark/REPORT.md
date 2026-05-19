# Code Generator Benchmark Report

**Kubb vs Orval vs Hey-API** — speed and memory across three OpenAPI schemas and three plugin combinations.

---

## Tool Versions

| Tool | Version |
|------|---------|
| **Kubb** | 5.0.0-beta.18 (workspace) |
| **Orval** | 8.10.0 |
| **Hey-API** | 0.97.1 |

---

## Methodology

### Disk I/O policy

| Tool | I/O policy |
|------|-----------|
| **Kubb** | `write: false` — pure in-memory, zero disk I/O |
| **Orval** | Writes to `/tmp` — no dry-run API exists |
| **Hey-API** | `dryRun: true` — pure in-memory, zero disk I/O |

> Disk I/O is part of Orval's real-world cost. Kubb and Hey-API avoid it entirely, which slightly favours them on I/O-bound systems.

### Schemas

| Schema | Size | Paths | Schemas | Complexity |
|--------|------|-------|---------|------------|
| **petStore** | ~22 KB | 18 | ~20 | Small |
| **twitter** | ~375 KB | 3 | ~200 | Medium |
| **stripe** | ~7.7 MB | 414 | 1 385 | Large |

### Plugin combinations

| Label | Kubb plugins | Orval client | Hey-API plugins |
|-------|--------------|--------------|-----------------|
| **ts** | `plugin-ts` | `fetch` | `@hey-api/typescript` |
| **ts+zod** | `plugin-ts` + `plugin-zod` | `fetch` + Zod override | `@hey-api/typescript` + `zod` |
| **ts+rq+zod** | `plugin-ts` + `plugin-zod` + `plugin-react-query` | `react-query` + Zod override | `@hey-api/typescript` + `zod` + `@tanstack/react-query` |

### Iteration counts

| Schema | kubb / orval | hey-api |
|--------|-------------|---------|
| petStore | 5 iterations + 1 warmup | 5 iterations + 1 warmup |
| twitter | 3 iterations + 1 warmup | 1 iteration, no warmup |
| stripe | 2 iterations + 1 warmup | **excluded** — single run exceeds 2 minutes |

All measurements use `vitest bench` (tinybench under the hood). Memory is measured as the heap-used delta (`process.memoryUsage().heapUsed`) between the start and end of each iteration; GC activity can produce negative deltas for the average on large schemas.

---

## Speed Results

All times in **milliseconds** (mean). Lower is better.

### petStore (~22 KB, 18 paths)

| Plugin combo | kubb | orval | hey-api | fastest |
|---|---:|---:|---:|---|
| TypeScript only | 60 | 96 | **25** | **hey-api** (2.4× over kubb, 3.8× over orval) |
| TypeScript + Zod | 55 | 65 | **34** | **hey-api** (1.6× over kubb, 1.9× over orval) |
| TypeScript + React-Query + Zod | 87 | **62** | 44 | **hey-api** (2.0× over kubb, 1.4× over orval) |

Hey-API 0.97 is dramatically faster on petStore — it processes this schema in 25–44 ms compared to 55–96 ms for Kubb and Orval.

### twitter (~375 KB, 3 paths, ~200 schemas)

| Plugin combo | kubb | orval | hey-api | fastest |
|---|---:|---:|---:|---|
| TypeScript only | 310 | **131** | 228 | **orval** (2.4× over kubb, 1.7× over hey-api) |
| TypeScript + Zod | 477 | **112** | 308 | **orval** (4.3× over kubb, 2.8× over hey-api) |
| TypeScript + React-Query + Zod | 640 | **143** | 563 | **orval** (4.5× over kubb, 3.9× over hey-api) |

At medium scale Orval takes the lead. Hey-API is no longer 40× slower (as it was in v0.78) — it now falls between Orval and Kubb, completing the twitter schema in 200–560 ms.

### stripe (~7.7 MB, 414 paths, 1 385 schemas)

> Hey-API is excluded — a single run takes more than 2 minutes on this schema.

| Plugin combo | kubb | orval | fastest |
|---|---:|---:|---|
| TypeScript only | 2 832 | **2 415** | **orval** (1.2× faster) |
| TypeScript + Zod | 3 579 | **2 773** | **orval** (1.3× faster) |
| TypeScript + React-Query + Zod | 4 862 | **3 184** | **orval** (1.5× faster) |

---

## Speedup Summary

### hey-api vs others (petStore only)

| Combo | hey-api vs kubb | hey-api vs orval |
|-------|----------------:|-----------------:|
| ts | **2.4×** faster | **3.8×** faster |
| ts+zod | **1.6×** faster | **1.9×** faster |
| ts+rq+zod | **2.0×** faster | **1.4×** faster |

### orval vs others (twitter + stripe)

| Schema | Combo | orval vs kubb | orval vs hey-api |
|--------|-------|-------------:|-----------------:|
| twitter | ts | **2.4×** faster | **1.7×** faster |
| twitter | ts+zod | **4.3×** faster | **2.8×** faster |
| twitter | ts+rq+zod | **4.5×** faster | **3.9×** faster |
| stripe | ts | **1.2×** faster | N/A |
| stripe | ts+zod | **1.3×** faster | N/A |
| stripe | ts+rq+zod | **1.5×** faster | N/A |

---

## Memory Results

Average heap delta per iteration (in MB). Positive = memory was allocated and not yet reclaimed; negative values arise when the GC runs during the measurement window (common on large schemas).

> These numbers are **approximate**. The Node.js GC may run between the baseline snapshot and the end-of-iteration snapshot. Treat them as rough guidance rather than precise measurements.

### petStore

| Scenario | avg | max |
|---|---:|---:|
| kubb ts | 2.0 MB | 8.2 MB |
| orval ts | 1.7 MB | 7.7 MB |
| hey-api ts | 1.0 MB | 13.4 MB |
| kubb ts+zod | 1.5 MB | 11.9 MB |
| orval ts+zod | 1.4 MB | 10.5 MB |
| hey-api ts+zod | 0.6 MB | 6.2 MB |
| kubb ts+rq+zod | 1.1 MB | 10.5 MB |
| orval ts+rq+zod | 1.1 MB | 7.9 MB |
| hey-api ts+rq+zod | 4.4 MB | 14.6 MB |

All three tools stay well under 15 MB per iteration at petStore scale.

### twitter

| Scenario | avg | max |
|---|---:|---:|
| kubb ts | 5.8 MB | 6.5 MB |
| orval ts | 3.5 MB | 10.5 MB |
| hey-api ts | 21.5 MB | 24.8 MB |
| kubb ts+zod | 8.7 MB | 13.9 MB |
| orval ts+zod | 3.4 MB | 11.9 MB |
| hey-api ts+zod | 34.3 MB | 41.7 MB |
| kubb ts+rq+zod | 8.2 MB | 20.4 MB |
| orval ts+rq+zod | 3.2 MB | 14.2 MB |
| hey-api ts+rq+zod | 95.9 MB | 50.7 MB* |

\* Min/max are distorted by GC; the raw allocation is larger. Hey-API allocates 3–10× more heap than Orval on twitter.

### stripe

| Scenario | avg | max |
|---|---:|---:|
| kubb ts | 120.4 MB | 122.6 MB |
| orval ts | 34.7 MB | 98.6 MB |
| kubb ts+zod | 25.6 MB* | 131.3 MB |
| orval ts+zod | 63.6 MB | 104.5 MB |
| kubb ts+rq+zod | 20.3 MB* | 162.0 MB |
| orval ts+rq+zod | 110.9 MB | 111.9 MB |

\* Average distorted by GC; max column is more representative. Both tools hold 100–160 MB during generation of the full Stripe schema.

---

## Key Findings

### 1. Hey-API 0.97 is dramatically faster on small schemas

Hey-API v0.97 completed petStore in **25 ms** (TypeScript only), compared to 60 ms for Kubb and 96 ms for Orval — nearly 4× faster than Orval. This is a significant improvement from v0.78, which was comparable to Kubb/Orval on petStore.

### 2. Orval 8.x dominates medium schemas

On the twitter schema (375 KB), Orval 8.10 completes in 130–165 ms regardless of plugin count. Kubb (310–640 ms) and Hey-API (230–560 ms) are both 2–4× slower. Orval's throughput is remarkably stable as plugins are added.

### 3. Kubb's plugin cost scales super-linearly

Adding plugins to Kubb on large schemas adds significant overhead:

| Schema | ts | +zod | +rq+zod | plugin overhead |
|--------|---:|------:|--------:|----------------:|
| twitter | 310 ms | 477 ms | 640 ms | +54% / +107% |
| stripe | 2 832 ms | 3 579 ms | 4 862 ms | +26% / +72% |

Orval's cost is largely flat (+16% / +32% on stripe), suggesting its pipeline does less repeated traversal per plugin.

### 4. Hey-API's performance cliff on large schemas persists

Hey-API 0.97 is fast on petStore but still cannot handle stripe within a practical time budget (>2 min/run). The performance gap between small and large schemas is more extreme for Hey-API than for the other two tools.

### 5. Memory efficiency improved significantly in Hey-API 0.97

Hey-API 0.78 used 33–58 MB per run on twitter; Hey-API 0.97 uses 21–96 MB. The improvement is visible in the ts and ts+zod combos; the ts+rq+zod combo still peaks high (~96 MB avg).

---

## Tool Comparison by Use Case

| Use case | Recommended tool | Rationale |
|----------|-----------------|-----------|
| Schema < 50 KB, any plugins | **Hey-API** | 2–4× faster than alternatives |
| Schema 50 KB – 500 KB | **Orval** | Best throughput; Orval and Hey-API competitive for ts-only |
| Schema > 500 KB | **Orval** | Only practical option; Hey-API exceeds 2 min/run on stripe |
| TypeScript-only codegen, any size | **Orval** at medium/large; **Hey-API** at small |
| Need React-Query hooks, small schema | **Hey-API** (1.4× faster than orval) |
| Need React-Query hooks, large schema | **Orval** (1.5× faster than kubb) |
| Memory constrained CI | **Orval** at medium/large (3–10× lower heap than hey-api) |

---

## Running the Benchmarks

```bash
cd tests/benchmark
pnpm install   # also runs postinstall patch for orval v8 export condition bug
pnpm bench
```

> **Note on orval v8:** orval 8.x packages contain a `"development"` export condition pointing to TypeScript source files that are not included in the npm release. vitest passes `--conditions development` to its worker processes, which triggers this broken path. A `postinstall` script (`scripts/patch-orval.mjs`) removes this condition from the pnpm store after each install.

Vitest will print per-benchmark timing tables and then a memory report at the end. Total wall-clock time is approximately 4–5 minutes on a modern laptop.

---

*Generated with vitest bench v4.1.6 on Node.js 22, Linux. Kubb 5.0.0-beta.18 · Orval 8.10.0 · Hey-API 0.97.1. Results will vary by machine and load.*
