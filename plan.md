# Bug Fix Plan: `$ref` requestBody not parsed in `@kubb/adapter-oas` ≥ alpha.54

## Problem

Since `@kubb/adapter-oas@5.0.0-alpha.54`, operations whose `requestBody` is a `$ref`
(e.g. `requestBody: { $ref: '#/components/requestBodies/Order' }`) produce
`requestBody: undefined` in the parsed AST.  
Downstream plugins (`plugin-ts`, `plugin-zod`) therefore emit `data?: never` instead of the
expected typed parameter, and the generated `*DataSchema` / `*Data` types are dropped entirely.

Affected test cases:
- `tests/3.0.x/main.test.ts` → `caseSensitivity` (inline schema inside a `$ref` requestBody)
- `tests/3.0.x/main.test.ts` → `issue2619` (external `$ref` requestBody whose content points to a named component schema)

## Root Cause

The regression is entirely inside `@kubb/adapter-oas` in two functions:
`getRequestBodyContentTypes` and `getRequestBodyMeta`.

### `dereferenceWithRef` preserves `$ref`

```ts
// packages/adapter-oas/src/utils.ts (roughly)
function dereferenceWithRef(document, schema) {
  if (isReference(schema)) return {
    ...schema,                          // keeps $ref
    ...resolveRef(document, schema.$ref),
    $ref: schema.$ref                   // explicit keep
  }
  return schema
}
```

By design this function keeps `$ref` on the result so that printers can track provenance.
`isReference` is simply `!!obj && '$ref' in obj`.

### `getRequestBodyContentTypes` guards against its own output

```ts
function getRequestBodyContentTypes(document, operation) {
  // 1. mutates requestBody to the deref'd value (still has $ref!)
  if (operation.schema.requestBody)
    operation.schema.requestBody = dereferenceWithRef(document, operation.schema.requestBody)

  const body = operation.schema.requestBody
  // 2. BUG: body now has $ref AND content, but isReference(body) === true
  //    so the function returns [] and content is never read
  if (!body || isReference(body)) return []

  const inline = body
  return inline.content ? Object.keys(inline.content) : []
}
```

Because the deref'd body still carries `$ref`, `isReference(body)` is `true` and
`getRequestBodyContentTypes` always returns `[]` for any `$ref` requestBody.

### `getRequestBodyMeta` has the same guard

```ts
function getRequestBodyMeta(operation) {
  const body = operation.schema.requestBody
  // BUG: same false-positive — body is deref'd but isReference is still true
  if (!body || isReference(body)) return { required: false }
  ...
}
```

### End-to-end flow in `parseOperation`

```ts
// allContentTypes is [] for every $ref requestBody
const allContentTypes = ctx.contentType
  ? [ctx.contentType]
  : getRequestBodyContentTypes(document, operation)   // returns []

const requestBodyMeta = getRequestBodyMeta(operation)  // returns { required: false }

const content = allContentTypes.flatMap(...)           // []

// Both conditions are false → requestBody = undefined
const requestBody =
  content.length > 0 || requestBodyMeta.description
    ? { ... }
    : void 0
```

## Fix

The fix belongs in `@kubb/adapter-oas` (the `kubb` monorepo, not this plugins repo).
Both affected functions must be changed to access `content` / metadata **directly from the
deref'd object** instead of bailing out because `$ref` is still present.

### 1. Fix `getRequestBodyContentTypes`

```ts
// Before
function getRequestBodyContentTypes(document, operation) {
  if (operation.schema.requestBody)
    operation.schema.requestBody = dereferenceWithRef(document, operation.schema.requestBody)
  const body = operation.schema.requestBody
  if (!body || isReference(body)) return []          // ← remove isReference check
  const inline = body
  return inline.content ? Object.keys(inline.content) : []
}

// After
function getRequestBodyContentTypes(document, operation) {
  if (operation.schema.requestBody)
    operation.schema.requestBody = dereferenceWithRef(document, operation.schema.requestBody)
  const body = operation.schema.requestBody as RequestBodyObject | undefined
  if (!body) return []                               // only guard for missing body
  // dereferenceWithRef keeps $ref but always spreads the resolved object's fields;
  // access content directly regardless of whether $ref is still present
  return body.content ? Object.keys(body.content) : []
}
```

### 2. Fix `getRequestBodyMeta`

```ts
// Before
function getRequestBodyMeta(operation) {
  const body = operation.schema.requestBody
  if (!body || isReference(body)) return { required: false }   // ← remove isReference check
  const inline = body
  return { description: inline.description, required: inline.required === true }
}

// After
function getRequestBodyMeta(operation) {
  const body = operation.schema.requestBody as RequestBodyObject | ReferenceObject | undefined
  if (!body) return { required: false }
  // After getRequestBodyContentTypes has run, body may still carry $ref but
  // the resolved fields (description, required, content) are already spread onto it.
  const resolved = body as RequestBodyObject
  return {
    description: resolved.description,
    required: resolved.required === true,
  }
}
```

### Why this is safe

- `dereferenceWithRef` always spreads the resolved object's own enumerable properties
  onto the result before re-adding `$ref`.  If the `$ref` pointed at a valid
  `RequestBodyObject`, then `description`, `required`, and `content` are already present
  on the returned object.
- The only case where `content` / `description` would still be absent is when
  `resolveRef` itself returns nothing (broken `$ref`), which is already handled by
  `getRequestSchema` returning `null` → `content` entry is skipped via `if (!schema) return []`.

## Verification

After the fix, run the following in the `kubb` monorepo:

```bash
pnpm build --filter @kubb/adapter-oas
pnpm test --filter @kubb/adapter-oas
```

Then, back in this `plugins` repo:

```bash
pnpm install
./node_modules/.bin/vitest run --config ./configs/vitest.config.ts
```

The `caseSensitivity` and `issue2619` snapshot tests must pass **and** the snapshots must
be reverted to their pre-regression content (i.e. `CreateOrderData` / `createReturnTypeADataSchema`
are generated again, and `data?` is typed correctly instead of `data?: never`).
