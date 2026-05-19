# Code Generator Benchmark Report

**Kubb vs Orval vs Hey-API** — speed and memory across three OpenAPI schemas and all available plugin combinations.

---

## Tool Versions

| Tool | Version |
|------|---------|
| **Kubb** | 5.0.0-beta.18 (workspace) |
| **Orval** | 8.10.0 |
| **Hey-API** | 0.97.1 |

---

## Plugin Coverage Matrix

All Kubb plugins and their closest equivalents in Orval and Hey-API.

| Kubb plugin | Orval equivalent | Hey-API equivalent | Benchmarked |
|-------------|-----------------|-------------------|:-----------:|
| `plugin-ts` | built-in (all clients emit types) | `@hey-api/typescript` | ✅ |
| `plugin-client` (fetch) | `client: 'fetch'` | `@hey-api/sdk` + `@hey-api/client-fetch` | ✅ |
| `plugin-zod` | `override: { zod: { generate: {...} } }` | `zod` | ✅ |
| `plugin-react-query` | `client: 'react-query'` | `@tanstack/react-query` | ✅ |
| `plugin-vue-query` | `client: 'vue-query'` | `@tanstack/vue-query` | ✅ |
| `plugin-msw` | `mock: 'msw'` | `@hey-api/msw` | ✅ |
| `plugin-faker` | `mock: true` (faker-based) | — | ✅ |
| `plugin-cypress` | — | — | ❌ |
| `plugin-mcp` | — | — | ❌ |
| `plugin-redoc` | — | — | ❌ |

Cypress, MCP, and ReDoc have no equivalents in either Orval or Hey-API and are excluded.

---

## Methodology

### Disk I/O policy

| Tool | I/O policy |
|------|-----------|
| **Kubb** | `write: false` — pure in-memory, zero disk I/O |
| **Orval** | Writes to `/tmp` — no dry-run API exists |
| **Hey-API** | `dryRun: true` — pure in-memory, zero disk I/O |

### Schemas

| Schema | Size | Paths | Schemas | Complexity |
|--------|------|-------|---------|------------|
| **petStore** | ~22 KB | 18 | ~20 | Small |
| **twitter** | ~375 KB | 3 | ~200 | Medium |
| **stripe** | ~7.7 MB | 414 | 1 385 | Large |

### Iteration counts

| Schema | kubb / orval | hey-api |
|--------|-------------|---------|
| petStore | 5 + 1 warmup | 5 + 1 warmup |
| twitter | 3 + 1 warmup | 1, no warmup |
| stripe | 2 + 1 warmup | **excluded** (>2 min/run) |

---

## Speed Results — petStore (~22 KB)

All times in **milliseconds** (mean). Lower is better. `—` = no equivalent.

| Plugin combo | kubb | orval | hey-api | fastest |
|---|---:|---:|---:|---|
| TypeScript only | 86 | 116 | **29** | hey-api (3.0× kubb, 4.0× orval) |
| TypeScript + Client | 81 | 101 | **41** | hey-api (2.0× kubb, 2.5× orval) |
| TypeScript + Zod | 77 | 85 | **46** | hey-api (1.7× kubb, 1.8× orval) |
| TypeScript + React-Query + Zod | 93 | 77 | **55** | hey-api (1.7× kubb, 1.4× orval) |
| TypeScript + Vue-Query + Zod | 87 | 86 | **59** | hey-api (1.5× kubb, 1.5× orval) |
| TypeScript + MSW | 53 | 82 | **15** | hey-api (3.6× kubb, 5.6× orval) |
| TypeScript + Faker | **73** | 74 | — | kubb ≈ orval |

Hey-API dominates petStore across every combination — particularly MSW, where it completes in just 15 ms.

---

## Speed Results — twitter (~375 KB)

| Plugin combo | kubb | orval | hey-api | fastest |
|---|---:|---:|---:|---|
| TypeScript only | 417 | **173** | 281 | orval (2.4× kubb, 1.6× hey-api) |
| TypeScript + Client | 595 | **177** | 437 | orval (3.4× kubb, 2.5× hey-api) |
| TypeScript + Zod | 781 | **222** | 709 | orval (3.5× kubb, 3.2× hey-api) |
| TypeScript + React-Query + Zod | 824 | **205** | 511 | orval (4.0× kubb, 2.5× hey-api) |
| TypeScript + Vue-Query + Zod | 881 | **220** | 566 | orval (4.0× kubb, 2.6× hey-api) |
| TypeScript + MSW | 482 | 306 | **174** | hey-api (2.8× kubb, 1.8× orval) |
| TypeScript + Faker | 671 | **273** | — | orval (2.5× kubb) |

Notable: **hey-api reclaims the lead for MSW on twitter** (174 ms vs 306 ms orval). For all other combos, Orval is the clear winner.

---

## Speed Results — stripe (~7.7 MB)

Hey-API is excluded (single run exceeds 2 minutes). Kubb and Orval only.

| Plugin combo | kubb | orval | orval advantage |
|---|---:|---:|---:|
| TypeScript only | 3 484 | **3 277** | 1.1× faster |
| TypeScript + Client | 4 549 | **3 124** | 1.5× faster |
| TypeScript + Zod | 4 892 | **3 290** | 1.5× faster |
| TypeScript + React-Query + Zod | 6 783 | **4 049** | 1.7× faster |
| TypeScript + Vue-Query + Zod | 6 686 | **4 335** | 1.5× faster |
| TypeScript + MSW | 4 075 | **2 149** | 1.9× faster |
| TypeScript + Faker | 5 382 | **2 172** | 2.5× faster |

Orval wins on every combination. The gap widens significantly for MSW and Faker.

---

## Speedup Summary

### petStore — hey-api vs others

| Combo | hey-api vs kubb | hey-api vs orval |
|-------|----------------:|-----------------:|
| TypeScript only | **3.0×** | **4.0×** |
| TypeScript + Client | **2.0×** | **2.5×** |
| TypeScript + Zod | **1.7×** | **1.8×** |
| TypeScript + React-Query + Zod | **1.7×** | **1.4×** |
| TypeScript + Vue-Query + Zod | **1.5×** | **1.5×** |
| TypeScript + MSW | **3.6×** | **5.6×** |
| TypeScript + Faker | — | — |

### twitter + stripe — orval vs others

| Schema | Combo | orval vs kubb | orval vs hey-api |
|--------|-------|-------------:|-----------------:|
| twitter | TypeScript only | **2.4×** | **1.6×** |
| twitter | TypeScript + Client | **3.4×** | **2.5×** |
| twitter | TypeScript + Zod | **3.5×** | **3.2×** |
| twitter | TypeScript + React-Query + Zod | **4.0×** | **2.5×** |
| twitter | TypeScript + Vue-Query + Zod | **4.0×** | **2.6×** |
| twitter | TypeScript + MSW | slower (1.8×) | hey-api wins |
| twitter | TypeScript + Faker | **2.5×** | — |
| stripe | TypeScript only | **1.1×** | — |
| stripe | TypeScript + Client | **1.5×** | — |
| stripe | TypeScript + Zod | **1.5×** | — |
| stripe | TypeScript + React-Query + Zod | **1.7×** | — |
| stripe | TypeScript + Vue-Query + Zod | **1.5×** | — |
| stripe | TypeScript + MSW | **1.9×** | — |
| stripe | TypeScript + Faker | **2.5×** | — |

---

## Memory Results (petStore)

Average heap delta per iteration. GC may run between snapshots — negative averages are measurement artifacts.

| Scenario | avg | max |
|---|---:|---:|
| kubb ts | 0.3 MB | 10.2 MB |
| orval ts | 3.6 MB | 16.6 MB |
| hey-api ts | 1.1 MB | 13.1 MB |
| kubb ts+client | 0.6 MB | 10.5 MB |
| orval ts+client | 0.0 MB | 8.2 MB |
| hey-api ts+client | 0.9 MB | 10.5 MB |
| kubb ts+zod | 0.1 MB | 12.9 MB |
| orval ts+zod | 2.6 MB | 7.9 MB |
| hey-api ts+zod | 2.6 MB | 5.9 MB |
| kubb ts+rq+zod | 1.4 MB | 9.6 MB |
| orval ts+rq+zod | 1.5 MB | 8.6 MB |
| hey-api ts+rq+zod | 3.2 MB | 14.2 MB |
| kubb ts+vq+zod | 92.8 MB* | 6.8 MB |
| orval ts+vq+zod | 3.0 MB | 10.8 MB |
| hey-api ts+vq+zod | 3.1 MB | 13.5 MB |
| kubb ts+msw | 0.5 MB | 9.5 MB |
| orval ts+msw | 1.6 MB | 8.3 MB |
| hey-api ts+msw | 0.9 MB | 6.6 MB |
| kubb ts+faker | 0.1 MB | 1.7 MB |
| orval ts+faker | 1.1 MB | 8.3 MB |

\* kubb ts+vq average distorted by GC; max column is representative (~7 MB actual pressure).

## Memory Results (twitter)

| Scenario | avg | max |
|---|---:|---:|
| kubb ts | 5.4 MB | 7.4 MB |
| orval ts | 5.9 MB | 12.0 MB |
| hey-api ts | 11.6 MB | 26.6 MB |
| kubb ts+client | 98.5 MB* | 8.6 MB |
| orval ts+client | 6.7 MB | 12.6 MB |
| hey-api ts+client | 1.1 MB | 33.1 MB |
| kubb ts+zod | 13.3 MB | 21.1 MB |
| orval ts+zod | 8.1 MB | 8.4 MB |
| hey-api ts+zod | 43.0 MB | 45.5 MB |
| kubb ts+rq+zod | 13.6 MB | 19.8 MB |
| orval ts+rq+zod | 7.7 MB | 10.7 MB |
| hey-api ts+rq+zod | 45.5 MB | 47.6 MB |
| kubb ts+vq+zod | 9.2 MB | 19.2 MB |
| orval ts+vq+zod | 7.9 MB | 12.5 MB |
| hey-api ts+vq+zod | 38.8 MB | 41.3 MB |
| kubb ts+msw | 7.0 MB | 10.0 MB |
| orval ts+msw | 11.5 MB | 16.5 MB |
| hey-api ts+msw | 8.2 MB | 14.2 MB |
| kubb ts+faker | 14.6 MB | 19.8 MB |
| orval ts+faker | 13.7 MB | 22.4 MB |

\* kubb ts+client average distorted by GC on twitter; max is ~9 MB actual.

## Memory Results (stripe)

| Scenario | avg | max |
|---|---:|---:|
| kubb ts | 16 MB* | 116 MB |
| orval ts | 111 MB | 127 MB |
| kubb ts+client | 8 MB* | 127 MB |
| orval ts+client | 95 MB | 97 MB |
| kubb ts+zod | 54 MB* | 132 MB |
| orval ts+zod | 95 MB* | 105 MB |
| kubb ts+rq+zod | 14 MB* | 145 MB |
| orval ts+rq+zod | 111 MB | 112 MB |
| kubb ts+vq+zod | 41 MB* | 144 MB |
| orval ts+vq+zod | 114 MB | 118 MB |
| kubb ts+msw | 77 MB* | 122 MB |
| orval ts+msw | 65 MB* | 82 MB |
| kubb ts+faker | 31 MB* | 151 MB |
| orval ts+faker | 3 MB* | 87 MB |

\* Average is GC-distorted. At stripe scale all generators hold **80–150 MB** of heap during generation.

---

## Key Findings

### 1. Hey-API is the fastest for small schemas — especially MSW

On petStore (22 KB), Hey-API outperforms both competitors across every plugin combination. The MSW benchmark is the most striking: hey-api completes in **15 ms** vs 53 ms for Kubb and 82 ms for Orval (~5.6× faster than Orval).

### 2. Orval dominates medium and large schemas

On twitter (375 KB) and stripe (7.7 MB), Orval is the fastest in 12 of 13 measurable combinations. The only exception is twitter MSW, where hey-api is faster (174 ms vs 306 ms).

### 3. MSW is a reversal point — hey-api leads at all scales except stripe

| Schema | MSW winner | margin |
|--------|-----------|--------|
| petStore | **hey-api** | 3.6× over kubb, 5.6× over orval |
| twitter | **hey-api** | 1.8× over orval, 2.8× over kubb |
| stripe | **orval** | 1.9× over kubb (hey-api excluded) |

### 4. Kubb's plugin cost grows faster than Orval's

How much each additional plugin adds to the mean generation time on stripe:

| From → To | kubb delta | orval delta |
|-----------|----------:|------------:|
| ts → ts+client | +1 065 ms | −153 ms |
| ts+client → ts+zod | +343 ms | +167 ms |
| ts+zod → ts+rq+zod | +1 891 ms | +759 ms |
| ts+zod → ts+vq+zod | +1 794 ms | +1 045 ms |
| ts → ts+msw | +591 ms | −1 128 ms |
| ts → ts+faker | +1 898 ms | −1 105 ms |

Note: Orval's MSW and Faker outputs are notably faster than its basic fetch client (fewer, simpler files to write).

### 5. React-Query and Vue-Query have nearly identical cost

The two query library plugins behave identically in all three generators:

| Schema | kubb rq vs vq | orval rq vs vq | hey-api rq vs vq |
|--------|:-------------:|:--------------:|:----------------:|
| petStore | 93 vs 87 ms | 77 vs 86 ms | 55 vs 59 ms |
| twitter | 824 vs 881 ms | 205 vs 220 ms | 511 vs 566 ms |
| stripe | 6 783 vs 6 686 ms | 4 049 vs 4 335 ms | — |

### 6. Faker (mock data) — only Kubb and Orval

No hey-api equivalent exists for faker-style mock data generation. Kubb and Orval are very close on petStore (73 ms vs 74 ms), but Orval is 2.5× faster at stripe scale.

### 7. Cypress, MCP, and ReDoc are Kubb-only

These three plugins have no equivalent in Orval or Hey-API.

---

## Tool Comparison by Use Case

| Scenario | Recommended | Rationale |
|----------|------------|-----------|
| Any schema ≤ 50 KB | **Hey-API** | Fastest across all combos; MSW especially |
| Schema 50 KB–1 MB, TypeScript / Client / Zod | **Orval** | 2–4× faster than alternatives |
| Schema 50 KB–1 MB, MSW | **Hey-API** | Faster than orval even at medium scale |
| Schema > 1 MB | **Orval** | Only practical option at full speed |
| React-Query or Vue-Query | **Orval** (medium/large), **Hey-API** (small) | |
| Faker mock factories | **Orval** or **Kubb** | Hey-API has no equivalent |
| Cypress / MCP / ReDoc | **Kubb** only | No competitor support |
| Memory constrained | **Orval** or **Kubb** | Hey-API uses 3–10× more heap at medium scale |

---

## Running the Benchmarks

```bash
cd tests/benchmark
pnpm install   # also runs postinstall patch for orval v8 export condition bug
pnpm bench
```

> **Note on orval v8:** orval 8.x packages contain a `"development"` export condition pointing to TypeScript source files not included in the npm release. vitest passes `--conditions development` to its workers, triggering this broken path. The `postinstall` script (`scripts/patch-orval.mjs`) removes this condition after each `pnpm install`.

Total wall-clock time is approximately 10 minutes for the full suite on a modern laptop.

---

*Generated with vitest bench v4.1.6 on Node.js 22, Linux. Kubb 5.0.0-beta.18 · Orval 8.10.0 · Hey-API 0.97.1.*
