# Plan: Support Multiple ContentTypes in requestBody

## Problem

Some OpenAPI specs declare multiple content types for a single operation's `requestBody`
(e.g. `application/json` **and** `multipart/form-data` with different schemas for each).
Today every plugin reads only `content[0]`, so the second content type is silently ignored.

**Goal:** Generate a single hook/client per operation that supports all declared content types,
with a `contentType` parameter defaulting to the adapter-oas configured type (or the first
type in the spec when no global override is set).

---

## Background / Codebase Context

### Repo layout

```
/Users/stijnvanhulle/GitHub/plugins   ← this repo (plugins)
/Users/stijnvanhulle/GitHub/kubb      ← upstream core (AST, adapter-oas)
```

### Key files

| File | Role |
|---|---|
| `kubb/packages/adapter-oas/src/parser.ts` | Parses OpenAPI → `OperationNode`. Already populates `requestBody.content[]` for every declared content type when no global `contentType` override is set (line 855). |
| `kubb/packages/adapter-oas/src/resolvers.ts` | `getRequestBodyContentTypes()`, `getRequestSchema()` |
| `kubb/packages/ast/src/nodes/operation.ts` | `OperationNode.requestBody.content` is already an **array**. The AST supports multiple entries today. |
| `packages/plugin-ts/src/generators/typeGenerator.tsx` line 151 | Reads `content[0]` only. |
| `packages/plugin-client/src/components/Client.tsx` line 86 | `const contentType = node.requestBody?.content?.[0]?.contentType ?? 'application/json'` |
| `packages/plugin-client/src/generators/clientGenerator.tsx` line 73 | `const isFormData = node.requestBody?.content?.[0]?.contentType === 'multipart/form-data'` |
| `packages/plugin-client/src/utils.ts` line 33 | `buildHeaders(contentType, hasHeaderParams)` |
| `packages/plugin-react-query/src/generators/mutationGenerator.tsx` line 55 | Reads `content[0]` only. |

### How the AST already works

`OasParserContext.contentType` is an optional global override.

```ts
// parser.ts line 855
const allContentTypes = ctx.contentType
  ? [ctx.contentType]                          // global override → single entry
  : getRequestBodyContentTypes(document, operation)  // no override → all entries
```

So `node.requestBody.content` is already a fully-populated array. Plugins just need to
consume it properly.

---

## Desired generated output

### Single content type (no change, backwards-compatible)

```ts
// plugin-ts: unchanged
export type CreatePathData = { name: string }

// plugin-client: unchanged
export async function createPath({ data }: { data: CreatePathData }, config = {}) {
  const requestData = data
  const res = await fetch<CreatePathResponse, ResponseErrorConfig<Error>, CreatePathData>({
    method: 'POST', url: '/path', data: requestData, ...config,
  })
  return res.data
}

// plugin-react-query: unchanged
export function useCreatePath() {
  return useMutation({ mutationFn: ({ data }) => createPath({ data }) })
}
```

### Multiple content types (new behaviour)

```ts
// plugin-ts: union alias added after individual types
export type CreatePathJsonData = { name: string }
export type CreatePathFormData = { file: File }
export type CreatePathData = CreatePathJsonData | CreatePathFormData  // ← new

// plugin-client: contentType param added, ternary replaces static isFormData
export async function createPath(
  { data, contentType = 'application/json' }: {
    data: CreatePathData
    contentType?: 'application/json' | 'multipart/form-data'
  },
  config = {},
) {
  const formData = buildFormData(data)  // buildFormData creates the FormData instance; `as FormData` is a type assertion only
  const res = await fetch<CreatePathResponse, ResponseErrorConfig<Error>, CreatePathData>({
    method: 'POST',
    url: '/path',
    data: contentType === 'multipart/form-data' ? formData as FormData : data,
    ...config,
  })
  return res.data
}

// plugin-react-query: contentType forwarded through mutation variables
export function useCreatePath() {
  return useMutation({
    mutationFn: ({ data, contentType }: { data: CreatePathData; contentType?: 'application/json' | 'multipart/form-data' }) =>
      createPath({ data, contentType }),
  })
}
```

---

## Implementation steps

All changes must be **backwards-compatible**: when `content.length === 1`, generated output
is identical to today.

### Step 1: `plugin-ts` typeGenerator

**File:** `packages/plugin-ts/src/generators/typeGenerator.tsx`

When `node.requestBody.content.length > 1`:
- The individual schema types are already generated per content entry (this works today when
  no global contentType override is set. Verify this assumption by running tests).
- Add a **union alias** after the individual types:
  ```ts
  export type CreatePathData = CreatePathJsonData | CreatePathFormData
  ```
- The union alias name must match what `tsResolver.resolveDataName(node)` returns (the same
  name used today for the single-type case), so downstream consumers (plugin-client,
  plugin-react-query) continue to reference `CreatePathData` without changes.
- The individual type names should follow the existing naming convention plus a content-type
  suffix. Determine the suffix from the content type string:
  - `application/json` → `Json`
  - `multipart/form-data` → `FormData`
  - `application/x-www-form-urlencoded` → `FormUrlEncoded`
  - anything else → capitalised last segment of the MIME type

### Step 2: `plugin-client` Client.tsx

**File:** `packages/plugin-client/src/components/Client.tsx`

Key change area: lines 86–88 (contentType / isFormData derivation) and lines 237–239
(formData / requestData usage).

When `node.requestBody?.content?.length > 1`:

1. **Derive the literal union type** for the `contentType` param:
   ```ts
   const contentTypeUnion = node.requestBody.content
     .map(e => JSON.stringify(e.contentType))
     .join(' | ')
   // e.g. "'application/json' | 'multipart/form-data'"
   ```

2. **Derive the default**: use `content[0].contentType` (this is the adapter-oas configured
   type when a global override is set, or the first type in the spec otherwise).

3. **Add `contentType` to the function params** (via `extraParams` in `getParams()` or
   directly in the rendered `<Function>` params string). It should be part of the destructured
   data/params object to match the existing param style.

4. **Replace the static `isFormData` check** with runtime usage:
   - Keep `const formData = buildFormData(data)` unconditionally when any content type is
     `multipart/form-data`.
   - Change `data: isFormData ? 'formData as FormData' : 'requestData'` to
     `data: contentType === 'multipart/form-data' ? formData as FormData : requestData`.

5. When `content.length === 1`: no change (existing static `isFormData` path unchanged).

**Also update** `clientGenerator.tsx` line 73:
```ts
// before
const isFormData = node.requestBody?.content?.[0]?.contentType === 'multipart/form-data'

// after: only used to determine whether buildFormData import is needed
const hasFormData = node.requestBody?.content?.some(e => e.contentType === 'multipart/form-data') ?? false
```

`classClientGenerator.tsx` line 162 and `staticClassClientGenerator.tsx` line 163 already use
`hasFormData` with `.some()`, but still narrow to `content?.[0]?...`. Update to check all
entries:
```ts
// before (already uses hasFormData but wrong: checks only content[0])
const hasFormData = ops.some((op) => op.node.requestBody?.content?.[0]?.contentType === 'multipart/form-data')

// after: checks all declared content types per operation
const hasFormData = ops.some((op) => op.node.requestBody?.content?.some(e => e.contentType === 'multipart/form-data'))
```

### Step 3: `plugin-react-query` mutationGenerator

**File:** `packages/plugin-react-query/src/generators/mutationGenerator.tsx`

**Also fix unconditional `buildFormData` import** (line 126): currently `buildFormData` is always
imported when `!shouldUseClientPlugin`, regardless of whether the operation has any
`multipart/form-data` content. Make it conditional:
```ts
// before
{!shouldUseClientPlugin && <File.Import name={['buildFormData']} ... />}

// after: only import when actually needed
{!shouldUseClientPlugin && node.requestBody?.content?.some(e => e.contentType === 'multipart/form-data') && (
  <File.Import name={['buildFormData']} ... />
)}
```

When `node.requestBody?.content?.length > 1`:

1. Add `contentType` to the mutation variable type:
   ```ts
   mutationFn: ({ data, contentType }: { data: CreatePathData; contentType?: '...' }) =>
     createPath({ data, contentType })
   ```

2. The literal union string for `contentType` can be derived the same way as in Step 2.

When `content.length === 1`: no change.

---

## Testing checklist

- [ ] Existing snapshot tests still pass (single content type = no output change)
- [ ] Add a test operation node with two content entries to `clientGenerator.test.tsx`
- [ ] Add same to `mutationGenerator.test.tsx`
- [ ] Add same to `typeGenerator.test.tsx` (verify union alias is emitted)
- [ ] Run `pnpm test` in `packages/plugin-ts`, `packages/plugin-client`,
      `packages/plugin-react-query`
- [ ] Verify `examples/` still generate cleanly with `pnpm generate` (or equivalent)

---

## Out of scope (follow-up)

- `plugin-vue-query`, `plugin-swr`: same pattern as plugin-react-query, can follow after
- `plugin-mcp`: same pattern
- Response content type union (only requestBody is in scope here)
