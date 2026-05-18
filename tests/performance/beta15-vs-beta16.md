# `@kubb/core` and `@kubb/adapter-oas` — beta.15 → beta.16 diff

---

## `@kubb/core`

### `constants.ts`

`PARALLEL_CONCURRENCY_LIMIT` is removed. Two new constants replace it:

```diff
- export const PARALLEL_CONCURRENCY_LIMIT = 16

+ export const STREAM_SCHEMA_THRESHOLD = 100
+ export const STREAM_FLUSH_EVERY = 50
```

`STREAM_SCHEMA_THRESHOLD` is the schema count at which the core switches from `adapter.parse()`
to `adapter.stream()`. `STREAM_FLUSH_EVERY` controls how often buffered files are flushed to
storage while schemas are still being iterated (every 50 schemas).

---

### `createAdapter.ts` — two new optional methods on `Adapter`

```diff
+ count?: (source: AdapterSource) => Promise<{ schemas: number; operations: number }>
+ stream?: (source: AdapterSource) => Promise<InputStreamNode>
```

`count` is a lightweight pre-flight that lets the core decide which path to take without
building the full AST. `stream` returns an `InputStreamNode` whose `.schemas` and
`.operations` properties are `AsyncIterable` — the spec is parsed one node at a time on
demand, never fully materialised in memory.

---

### `defineGenerator.ts` — `operations` accepts async iterables

```diff
- operations?: (nodes: Array<OperationNode>, ctx: GeneratorContext<TOptions>) => ...
+ operations?: (
+   nodes: Array<OperationNode> | AsyncIterable<OperationNode>,
+   ctx: GeneratorContext<TOptions>,
+ ) => ...
```

The union exists for type completeness. The core always collects operations into an array
before calling `operations()`, so plugins will continue to receive `Array<OperationNode>` at
runtime. The type will be narrowed back to `Array<OperationNode>` in a subsequent beta.

---

### `createKubb.ts` — streaming branch in the adapter setup

Beta.15 always called `adapter.parse()`:

```ts
// beta.15
driver.inputNode = await config.adapter.parse(source)
```

Beta.16 checks whether the adapter supports streaming and whether the spec is large enough
to justify it:

```ts
// beta.16
if (config.adapter.count && config.adapter.stream) {
  const { schemas: schemaCount } = await config.adapter.count(source)

  if (schemaCount > STREAM_SCHEMA_THRESHOLD) {
    driver.inputStreamNode = await config.adapter.stream(source)
  } else {
    driver.inputNode = await config.adapter.parse(source)
  }
} else {
  driver.inputNode = await config.adapter.parse(source)
}
```

A new `runPluginStreamHooks` function handles the streaming path. It iterates schemas and
operations exactly once and fans each node to every registered plugin in parallel, replacing
the beta.15 pattern where each plugin independently walked the full `inputNode` array:

```ts
// beta.16 — single parse pass, fanned to all plugins
for await (const node of inputStreamNode.schemas) {
  for (const state of states) {          // all plugins see the same node
    await gen.schema(node, ctx)
  }
  if (++schemasProcessed % STREAM_FLUSH_EVERY === 0) {
    await flushPendingFiles()            // bound in-memory file buffers
  }
}
```

The plugin execution loop itself is split into two branches: streaming specs go through
`runPluginStreamHooks`, batch specs follow the original sequential per-plugin loop unchanged.

---

### `PluginDriver.ts` — `inputStreamNode` field + reset

```diff
+ inputStreamNode: InputStreamNode | undefined = undefined
```

Added alongside the existing `inputNode`. The context accessor `get inputNode()` now returns
a synthetic fallback when only `inputStreamNode` is set:

```diff
- get inputNode(): InputNode | undefined {
-   return driver.inputNode
+ get inputNode(): InputNode {
+   return driver.inputNode ?? {
+     kind: 'Input', schemas: [], operations: [], meta: driver.inputStreamNode?.meta
+   }
```

`inputStreamNode` is cleared on `reset()` alongside `inputNode`.

The `operationsHandler` type in generator registration is updated to match the new
`defineGenerator` signature:

```diff
- const operationsHandler = async (nodes: Array<OperationNode>, ctx) => {
+ const operationsHandler = async (nodes: AsyncIterable<OperationNode> | Array<OperationNode>, ctx) => {
```

---

### `FileProcessor.ts` — streaming file processor replaces parallel runner

`PARALLEL_CONCURRENCY_LIMIT` and `p-limit` are removed. The `run()` mode option
(`sequential` | `parallel`) is removed. A new `stream()` method is added that yields files
one at a time as they are parsed:

```diff
- async run(files, { parsers, mode = 'sequential', extension }): Promise<FileNode[]> {
+ async *stream(files, options): AsyncGenerator<ParsedFile> {
+   for (const file of files) {
+     const source = await this.parse(file, options)
+     processed++
+     yield { file, source, processed, total, percentage: (processed / total) * 100 }
+   }
+ }
```

`run()` is kept but reimplemented on top of `stream()`. `createKubb.ts` now uses
`fileProcessor.stream()` directly so it can emit `kubb:file:processing:update` events and
write each file to storage as soon as it is ready, instead of waiting for the full batch.

---

## `@kubb/adapter-oas`

### `adapter.ts` — `count` and `stream` implementations

The adapter gains the two new methods required by the core.

**Document and schema caching.** The adapter now caches both the parsed document and the
extracted schema object map so that `count`, `stream`, and `parse` share a single load:

```ts
async function ensureDocument(source) { ... }  // cached after first call
async function ensureSchemas(document) { ... } // cached after first call
```

**`count`** uses `oas.getPaths()` for operation counting and `Object.keys(schemas).length`
for schema counting — no AST nodes are built:

```ts
async count(source) {
  const document = await ensureDocument(source)
  const schemas = await ensureSchemas(document)
  const baseOas = new BaseOas(document)
  const operationCount = Object.values(baseOas.getPaths())
    .flatMap(Object.values).filter(Boolean).length
  return { schemas: Object.keys(schemas).length, operations: operationCount }
}
```

**`stream`** returns async iterables that parse schemas and operations lazily. Each
`[Symbol.asyncIterator]()` call creates a fresh generator, so multiple `for await` passes
produce independent results without shared mutable state:

```ts
const schemasIterable: AsyncIterable<ast.SchemaNode> = {
  [Symbol.asyncIterator]() {
    return (async function* () {
      for (const [name, schema] of Object.entries(schemas)) {
        yield parseSchema({ schema, name }, parserOptions)
      }
    })()
  },
}
```

---

### `discriminator.ts` — refactored for streaming

Beta.15 applied discriminator inheritance as a single post-processing pass over the full
`InputNode`. Beta.16 splits this into two composable functions so the streaming path can
apply patches inline per yielded node:

| Function | Purpose |
|---|---|
| `buildDiscriminatorChildMap(schemas)` | Scans only the union/discriminator parents (extracted from full list) and returns a `Map<name, patch>` |
| `patchDiscriminatorNode(node, entry)` | Applies a single discriminator patch to one `SchemaNode`, called inline in the `stream()` generator |
| `applyDiscriminatorInheritance(root)` | Unchanged batch helper; now delegates to the two functions above |

---

### `parser.ts` — `createSchemaParser` exported

`createSchemaParser` changes from a file-private function to a named export so `adapter.ts`
can call it directly in the streaming path:

```diff
- function createSchemaParser(ctx) {
+ export function createSchemaParser(ctx) {
```
