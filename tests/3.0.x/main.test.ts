import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureValidVarName, getRelativePath, pascalCase } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, type KubbHooks } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

const configs = [
  {
    name: 'simple',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      adapter: adapterOas({ validate: false, enums: 'root' }),
      output: {
        path: './gen',
        barrel: false,
      },
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'petStore',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, discriminator: 'propagate', enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'discriminatorAllOf',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/discriminatorAllOf.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
        }),
        pluginZod({
          output: {
            path: './zod',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'discriminatorAnyOf',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/discriminatorAnyOf.yaml',
      output: {
        path: './gen',
        clean: true,
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({}),
        pluginZod({
          output: {
            path: './zod',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'discriminatorOneOf',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/discriminatorOneOf.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
        }),
        pluginZod({
          output: {
            path: './zod',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    /**
     * A `oneOf` discriminator with no `mapping`: the discriminant value for each variant is implied
     * by its ref name (Cat → 'Cat', Dog → 'Dog'). The variants inherit a shared base through
     * `allOf`, so they flatten to objects and the union emits z.discriminatedUnion.
     */
    name: 'discriminatorImplicit',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/discriminatorImplicit.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: {
            path: './zod',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'discriminatorOneOfMini',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/discriminatorOneOf.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          mini: true,
          output: {
            path: './zod',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'discriminatorOneOfExternalRef',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/discriminatorOneOfExternalRef.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: {
            path: './zod',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'caseSensitivity',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/caseSensitivity.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    name: 'duplicateEnum',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/duplicateEnum.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    /**
     * Regression test for https://github.com/kubb-labs/kubb/issues/2619
     *
     * When a main spec delegates requestBodies and responses to an external file, all schemas
     * defined in that external file (e.g. Parcel, Result) should get their own separate Zod
     * schema files instead of being inlined or self-referencing (`z.lazy(() => parcelSchema)`).
     */
    name: 'issue2619',
    config: {
      root: __dirname,
      input: '../../schemas/external-refs/returns/main.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: {
            path: './zod',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    /**
     * Regression test for https://github.com/kubb-labs/kubb/issues/2696
     *
     * When path operations use external path-item $refs (e.g. `$ref: './paths/me.yaml'`) and
     * components.schemas also reference the same external schema files, pluginTs must NOT
     * generate phantom imports like `import type { Me } from "./Me.ts"` (derived from the path
     * segment) or `import type { Items }` (derived from the array keyword). It should correctly
     * use `User` and `Employer` as derived from the actual schema file names.
     */
    name: 'issue2696',
    config: {
      root: __dirname,
      input: '../../schemas/external-refs/phantom/main.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
        }),
      ],
    },
  },
  {
    /**
     * Regression test for Bug 3: with enumType='asConst', enum files must export
     * a PascalCase type alias (e.g. `export type Status = StatusKey`) so that
     * other files importing the PascalCase name resolve correctly.
     */
    name: 'asConstEnum',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/asConstEnum.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
          enum: { type: 'asConst' },
        }),
      ],
    },
  },
  {
    /**
     * Regression test for Bug 4: operations with no tags + operationIds containing
     * version-like dots (e.g. v2025.0) that should not be split into path segments.
     */
    name: 'noTagsDotOperationId',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/noTagsDotOperationId.yaml',
      output: {
        path: './gen',
        barrel: false,
      },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: {
            path: './types',
            barrel: false,
          },
          group: { type: 'tag' },
        }),
      ],
    },
  },
  {
    /**
     * Verifies that `resolver.name` override is applied.
     * Every operation-derived name (params, responses, etc.) gets a `Custom` prefix
     * while schema type names (which use `default(name, 'type')`) are unaffected.
     * Returning `null`/`undefined` from any method falls back to the preset resolver.
     */
    name: 'resolverCustomPrefix',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/simple.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: { path: './types', barrel: false, banner: '// Custom banner' },
          resolver: {
            name(name: string) {
              return `Custom${ensureValidVarName(pascalCase(name))}`
            },
          },
        }),
      ],
    },
  },
  {
    /**
     * Verifies that `printer.nodes` overrides are applied in pluginZod.
     * The `integer` handler is replaced so all integer fields produce `z.number()`
     * instead of the default `z.int()`.
     */
    name: 'printerNodesZod',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/simple.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginZod({
          output: { path: './zod', barrel: false },
          printer: {
            nodes: {
              integer() {
                return 'z.number()'
              },
            },
          },
        }),
      ],
    },
  },
  {
    /**
     * Verifies that a macro is applied to each SchemaNode before printing.
     * The macro strips `description` from every node, so generated type files
     * contain no `@description` JSDoc tags.
     */
    name: 'transformerStripDescriptions',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/simple.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({
          output: { path: './types', barrel: false },
          macros: [
            {
              name: 'strip-descriptions',
              schema(node) {
                return { ...node, example: 'test', description: undefined }
              },
            },
          ],
        }),
      ],
    },
  },
]

describe(`Main OpenAPI ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, diagnostics } = await createKubb(
      {
        ...config,
        output: {
          ...config.output,
          path: output,
        },
      } as unknown as Config,
      {
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(files.length).toBeGreaterThan(1)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'main', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
