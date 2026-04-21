# Plan: Extend Plugin JSON Schema with `tip` and `values` Fields

## Context

Plugin configuration options are defined in two places:

1. **`plugins/*.yaml`** — source-of-truth YAML files in this repo that describe every plugin's options (name, type, description, default, properties, …).
2. **`schemas/plugins/plugin.json`** in the [kubb-labs/kubb](https://github.com/kubb-labs/kubb) repo — the JSON Schema that validates those YAML files (referenced via `$schema`).

The goal is to extend `pluginOption` in `plugin.json` with two new optional fields:

- **`values`** — per-value metadata for options whose `type` is a union of string literals.  
- **`tip`** — a short callout rendered as a `> [!TIP]` block in the docs.

---

## 1. Schema changes (`kubb-labs/kubb`)

**File:** `schemas/plugins/plugin.json`  
**Location:** inside the `definitions.pluginOption` object (or wherever option items are described).

### 1a. Add `tip`

```json
"tip": {
  "type": "string",
  "description": "Optional callout rendered as a > [!TIP] block directly under the option's metadata table."
}
```

### 1b. Add `values`

```json
"values": {
  "type": "array",
  "description": "Per-value metadata for union-typed options. Each entry documents one possible literal value.",
  "items": {
    "type": "object",
    "required": ["name"],
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string",
        "description": "The literal value string, e.g. \"'object'\" or \"'inline'\"."
      },
      "description": {
        "type": "string",
        "description": "What this specific value does."
      },
      "example": {
        "type": "string",
        "description": "TypeScript code snippet showing generated output when this value is active."
      }
    }
  }
}
```

Both fields are **optional** — existing YAML files continue to validate without change.

---

## 2. YAML updates (`kubb-labs/plugins`)

Once the schema is published, update `plugins/*.yaml` to use the new fields on options that have union types or that benefit from a tip.

### Priority options per file

| File | Options to update |
|---|---|
| `plugin-client.yaml` | `client`, `clientType`, `dataReturnType`, `parser`, `paramsType`, `pathParamsType` |
| `plugin-ts.yaml` | `syntaxType`, `optionalType`, `arrayType`, `enumType`, `enumKeyCasing` |
| `plugin-react-query.yaml` | `paramsType`, `pathParamsType`, `parser`, `client.dataReturnType`, `client.clientType` |
| `plugin-vue-query.yaml` | same as react-query |
| `plugin-svelte-query.yaml` | same as react-query |
| `plugin-solid-query.yaml` | same as react-query |
| `plugin-swr.yaml` | `dataReturnType`, `paramsType`, `pathParamsType` |
| `plugin-msw.yaml` | `dataReturnType` |
| `plugin-cypress.yaml` | `dataReturnType`, `paramsType`, `pathParamsType` |
| `plugin-faker.yaml` | `dateParser`, `regexGenerator` |
| `plugin-zod.yaml` | `importPath`, `dateType`, `guidType` |

### Example YAML shape

```yaml
- name: paramsType
  type: "'object' | 'inline'"
  required: false
  default: "'inline'"
  description: Defines how parameters are passed to generated functions.
  tip: When `paramsType` is `'object'`, `pathParamsType` is also forced to `'object'`.
  values:
    - name: "'object'"
      description: Merges all params into a single destructured object argument.
      example: |
        export async function deletePet(
          { petId, headers }: {
            petId: DeletePetPathParams['petId']
            headers?: DeletePetHeaderParams
          },
          config: Partial<RequestConfig> = {},
        ) { ... }
    - name: "'inline'"
      description: Passes each parameter as a separate function argument.
      example: |
        export async function deletePet(
          petId: DeletePetPathParams['petId'],
          headers?: DeletePetHeaderParams,
          config: Partial<RequestConfig> = {},
        ) { ... }
```

---

## 3. Docs rendering contract (`kubb.dev`)

When the docs generator reads a plugin option object:

- **`tip` present** → render immediately after the option metadata table:
  ```markdown
  > [!TIP]
  > {tip}
  ```

- **`values` present** → render a VitePress `::: code-group` block with one tab per entry.  
  Each tab:
  - Label = `values[i].name` (the literal value string)
  - Body = `values[i].description` (optional sentence) followed by a `ts` code block containing `values[i].example`

---

## 4. Order of execution

1. **PR in `kubb-labs/kubb`** — extend `schemas/plugins/plugin.json` with `tip` and `values` (Step 1).
2. **Wait for schema to be published** to `raw.githubusercontent.com` (merge to main is sufficient, no release needed for the schema file).
3. **PR in `kubb-labs/plugins`** — update `plugins/*.yaml` files (Step 2).
4. **PR in `kubb.dev`** — update the docs rendering logic (Step 3).
