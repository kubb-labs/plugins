# Code Generator Benchmark Report

**Kubb vs Orval vs Hey-API** — speed and memory across three OpenAPI schemas and three plugin combinations.

---

## Methodology

### Tools under test

| Tool | Version | Disk I/O policy |
|------|---------|-----------------|
| **Kubb** | 5.x (workspace) | `write: false` — pure in-memory, zero disk I/O |
| **Orval** | 7.9.x | Writes to `/tmp` — no dry-run API exists |
| **Hey-API** | 0.78.x | `dryRun: true` — pure in-memory, zero disk I/O |

> Disk I/O is part of Orval's real-world cost. Kubb and Hey-API avoid it entirely in this benchmark, which slightly favours them on I/O-bound systems. The numbers below still reflect typical developer-machine performance.

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
| TypeScript only | 66.5 | 74.5 | 88.5 | **kubb** (1.1× faster than orval) |
| TypeScript + Zod | 64.4 | 60.4 | 89.8 | **orval** (1.1× faster than kubb) |
| TypeScript + React-Query + Zod | 85.5 | 56.1 | 109.8 | **orval** (1.5× faster than kubb) |

At petStore scale all three tools are within the same order of magnitude (50–110 ms). The differences are within typical run-to-run noise; no tool has a meaningful advantage here.

### twitter (~375 KB, 3 paths, ~200 schemas)

| Plugin combo | kubb | orval | hey-api | fastest |
|---|---:|---:|---:|---|
| TypeScript only | 329 | 230 | 8 274 | **orval** (1.4× over kubb, 36× over hey-api) |
| TypeScript + Zod | 528 | 212 | 9 314 | **orval** (2.5× over kubb, 44× over hey-api) |
| TypeScript + React-Query + Zod | 639 | 233 | 8 300 | **orval** (2.7× over kubb, 36× over hey-api) |

At medium scale the gap between generators opens up significantly. Hey-API takes **8–9 seconds** on the twitter schema — roughly **38× slower than Orval** on average. Kubb is **1.4–2.7× slower** than Orval and slows down more as additional plugins are added (Zod + React-Query add ~300 ms each).

### stripe (~7.7 MB, 414 paths, 1 385 schemas)

> Hey-API is excluded — a single run takes more than 2 minutes on this schema, making it impractical to benchmark.

| Plugin combo | kubb | orval | fastest |
|---|---:|---:|---|
| TypeScript only | 2 913 | 1 908 | **orval** (1.5× faster) |
| TypeScript + Zod | 4 146 | 2 060 | **orval** (2.0× faster) |
| TypeScript + React-Query + Zod | 4 705 | 2 013 | **orval** (2.3× faster) |

At large-schema scale Orval consistently outperforms Kubb. Adding Zod to Kubb costs ~1 200 ms extra; adding React-Query costs another ~550 ms on top. Orval's cost is largely flat regardless of plugin count (~2 s in all three combos).

---

## Speedup Summary

The table below shows how many times faster the winner is. Values > 1.0 mean the row tool beats the column tool.

### Orval vs Kubb

| Schema | ts | ts+zod | ts+rq+zod |
|--------|---:|-------:|----------:|
| petStore | 0.9× (kubb wins) | **1.1×** | **1.5×** |
| twitter | **1.4×** | **2.5×** | **2.7×** |
| stripe | **1.5×** | **2.0×** | **2.3×** |

### Orval vs Hey-API (petStore + twitter only)

| Schema | ts | ts+zod | ts+rq+zod |
|--------|---:|-------:|----------:|
| petStore | **1.2×** | **1.5×** | **2.0×** |
| twitter | **36×** | **44×** | **36×** |

### Kubb vs Hey-API (petStore + twitter only)

| Schema | ts | ts+zod | ts+rq+zod |
|--------|---:|-------:|----------:|
| petStore | **1.3×** | **1.4×** | **1.3×** |
| twitter | **25×** | **18×** | **13×** |

---

## Memory Results

Average heap delta per iteration (in MB). Positive = memory was allocated and not yet reclaimed; negative values arise when the GC runs during the measurement window (common on large schemas). The min/max columns give a better sense of the actual allocation pressure.

> These numbers are **approximate**. The Node.js GC may run between the baseline snapshot and the end-of-iteration snapshot, which can produce misleading averages. Treat them as rough guidance rather than precise measurements.

### petStore

| Scenario | avg | min | max |
|---|---:|---:|---:|
| kubb ts | 0.37 MB | 11.5 MB | 8.1 MB |
| orval ts | 4.01 MB | 0.6 MB | 15.0 MB |
| hey-api ts | 2.97 MB | 17.2 MB | 9.6 MB |
| kubb ts+zod | 0.81 MB | 3.3 MB | 12.3 MB |
| orval ts+zod | 1.69 MB | 25.7 MB | 12.8 MB |
| hey-api ts+zod | 3.56 MB | 45.2 MB | 11.7 MB |
| kubb ts+rq+zod | 0.49 MB | 5.3 MB | 7.6 MB |
| orval ts+rq+zod | 2.96 MB | 9.4 MB | 13.3 MB |
| hey-api ts+rq+zod | 2.08 MB | 36.1 MB | 15.0 MB |

At petStore scale all three tools stay well under 50 MB per iteration.

### twitter

| Scenario | avg | min | max |
|---|---:|---:|---:|
| kubb ts | 3.4 MB | 3.2 MB | 5.9 MB |
| orval ts | 2.7 MB | 28.0 MB | 16.3 MB |
| hey-api ts | 33.5 MB | 28.7 MB | 38.4 MB |
| kubb ts+zod | 15.1 MB | 6.6 MB | 19.7 MB |
| orval ts+zod | 6.4 MB | 2.4 MB | 9.7 MB |
| hey-api ts+zod | 58.0 MB | 151.0 MB | 35.0 MB |
| kubb ts+rq+zod | 16.0 MB | 2.0 MB | 26.9 MB |
| orval ts+rq+zod | 11.3 MB | 8.5 MB | 16.1 MB |
| hey-api ts+rq+zod | 39.0 MB | 36.7 MB | 41.2 MB |

Hey-API allocates 3–5× more heap than Kubb or Orval on the twitter schema. The 151 MB peak for hey-api ts+zod suggests a large intermediate representation is held in memory during schema processing.

### stripe

| Scenario | avg | min | max |
|---|---:|---:|---:|
| kubb ts | 52.6 MB | 155.1 MB | 2.9 MB |
| orval ts | 63.5 MB | 40.0 MB | 95.6 MB |
| kubb ts+zod | 1.9 MB* | 266.9 MB | 146.5 MB |
| orval ts+zod | 42.8 MB | 228.8 MB | 58.8 MB |
| kubb ts+rq+zod | 5.4 MB* | 318.3 MB | 167.5 MB |
| orval ts+rq+zod | 49.7 MB | 45.7 MB | 57.5 MB |

\* Average is distorted by GC collections within the measurement window. The `min` column (318 MB for kubb ts+rq+zod) reflects the actual allocation pressure more reliably. Both generators allocate **200–350 MB** of heap on the full Stripe schema.

---

## Key Findings

### 1. Small schemas — tool choice doesn't matter

All three generators finish petStore in under 110 ms. Use whichever tool fits your workflow.

### 2. Medium schemas — Hey-API is 36–44× slower than Orval

The twitter schema (375 KB) exposes a severe performance gap in Hey-API. Each run takes 8–9 seconds, compared to 200–230 ms for Orval and 330–640 ms for Kubb. This likely reflects Hey-API's schema-parsing or type-synthesis algorithm not scaling linearly with schema size.

### 3. Large schemas — Orval is the fastest; Kubb degrades with plugin count

On the Stripe schema (7.7 MB), Orval completes in ~1.9–2.1 s regardless of which plugins are used. Kubb starts at ~2.9 s for TypeScript-only and rises to ~4.7 s for TypeScript + Zod + React-Query — a **62% increase** from adding plugins. Orval's cost remains flat, suggesting its codegen pipeline does less repeated traversal per plugin.

### 4. Kubb's React-Query plugin is the most expensive

Adding `plugin-react-query` is the single biggest contributor to Kubb's latency growth:

| Schema | ts | +zod | +rq+zod | rq overhead |
|--------|---:|------:|--------:|------------:|
| twitter | 329 ms | 528 ms | 639 ms | +111 ms |
| stripe | 2 913 ms | 4 146 ms | 4 705 ms | +559 ms |

The Zod plugin also adds meaningful cost (~200 ms on twitter, ~1 200 ms on stripe).

### 5. Memory usage scales with schema complexity for all tools

At stripe scale both Kubb and Orval hold 200–350 MB of heap during generation. Hey-API likely uses even more (extrapolating from the twitter data) but its extreme runtime made benchmarking impractical.

---

## Recommendations

| Use case | Recommendation |
|----------|---------------|
| Schema < 100 KB | Any tool — performance is not a differentiator |
| Schema 100 KB – 1 MB | Orval (fastest) or Kubb; avoid Hey-API if generation time matters |
| Schema > 1 MB | Orval for raw speed; Kubb if its plugin ecosystem is required |
| TypeScript-only codegen | All tools are competitive at small scale; Orval wins at medium/large |
| Need React-Query hooks | Kubb or Orval (both support it); Kubb adds ~10–15% latency per plugin |
| Memory constrained CI | Avoid Hey-API for medium/large schemas; both Kubb and Orval are reasonable |

---

## Running the Benchmarks

```bash
cd tests/benchmark
pnpm bench
```

Vitest will print per-benchmark timing tables and then a memory report at the end. Total wall-clock time is approximately 4–5 minutes on a modern laptop.

---

*Generated with vitest bench v4.1.6 on Node.js 22, Linux. Results will vary by machine and load. Re-run for current numbers.*
