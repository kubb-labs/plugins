import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { ast, type Config, Diagnostics, type KubbHooks, fsStorage } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import ts from 'typescript'
import { describe, expect, onTestFinished, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'reporters'> & { plugins: unknown }

const configs: Array<{ name: string; config: BuildConfig }> = [
  // ─── basic ──────────────────────────────────────────────────────────────
  {
    name: 'petStore',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
        }),
      ],
    },
  },

  // ─── locale ─────────────────────────────────────────────────────────────
  {
    name: 'locale',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          locale: 'de',
        }),
      ],
    },
  },

  // ─── seed ───────────────────────────────────────────────────────────────
  {
    name: 'seed',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          seed: [42],
        }),
      ],
    },
  },

  // ─── macros (property values) ───────────────────────────────────────────
  {
    name: 'macros',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          macros: [
            {
              name: 'pet-status-values',
              schema(node) {
                if (node.name === 'Pet' && 'properties' in node) {
                  return {
                    ...node,
                    properties: node.properties.map((property) =>
                      property.name === 'status'
                        ? { ...property, schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['pending'] }) }
                        : property,
                    ),
                  }
                }
                return node
              },
            },
          ],
        }),
      ],
    },
  },

  // ─── dateParser ─────────────────────────────────────────────────────────
  {
    name: 'dateParserDayjs',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          dateParser: 'dayjs',
        }),
      ],
    },
  },

  // ─── regexGenerator ─────────────────────────────────────────────────────
  {
    name: 'regexGeneratorRandexp',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          regexGenerator: 'randexp',
        }),
      ],
    },
  },

  // ─── paramsCasing ───────────────────────────────────────────────────────
  {
    name: 'paramsCasing',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/paramsCasing.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
        }),
      ],
    },
  },

  // ─── exclude / include ─────────────────────────────────────────────────
  {
    name: 'excludeByOperationId',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          exclude: [
            { type: 'operationId', pattern: 'addPet' },
            { type: 'operationId', pattern: 'deletePet' },
          ],
        }),
      ],
    },
  },
  {
    name: 'includeByTag',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          include: [{ type: 'tag', pattern: 'pet' }],
        }),
      ],
    },
  },

  // ─── group ──────────────────────────────────────────────────────────────
  {
    name: 'groupByTag',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({
          output: { path: './faker', barrel: false, mode: 'directory' },
          group: { type: 'tag' },
        }),
      ],
    },
  },
]

describe(`plugin-faker options ${version}`, () => {
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
      } as Config,
      {
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(files.length).toBeGreaterThan(0)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginFaker', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})

test('preserves required properties in contextual factory calls and infers overrides from data', async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.faker-inference-'))
  onTestFinished(() => fs.rm(root, { recursive: true, force: true }))

  const { diagnostics } = await createKubb({
    root,
    input: {
      openapi: '3.0.3',
      info: { title: 'Faker inference', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Category: {
            type: 'object',
            required: ['id', 'name'],
            properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' } },
          },
          Pet: {
            type: 'object',
            required: ['id', 'name', 'photoUrls', 'category'],
            properties: {
              id: { type: 'integer', format: 'int64' },
              name: { type: 'string' },
              photoUrls: { type: 'array', items: { type: 'string' } },
              category: { nullable: true, allOf: [{ $ref: '#/components/schemas/Category' }] },
            },
          },
          DetailedCategory: {
            allOf: [{ $ref: '#/components/schemas/Category' }, { type: 'object', required: ['active'], properties: { active: { type: 'boolean' } } }],
          },
          Animal: { oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }] },
          Cat: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'integer' }, friend: { $ref: '#/components/schemas/Animal' } },
          },
          Dog: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
        },
      },
    },
    adapter: adapterOas(),
    parsers: [parserTs()],
    storage: fsStorage(),
    output: { path: 'generated', clean: true, format: false, lint: false },
    plugins: [pluginTs({ output: { path: 'types' } }), pluginFaker({ output: { path: 'mocks' } })],
  }).safeBuild()

  expect(Diagnostics.hasError(diagnostics)).toBe(false)
  const catSource = await fs.readFile(path.join(root, 'generated/mocks/createCat.ts'), 'utf8')
  expect(catSource).toContain('get friend()')

  const usagePath = path.join(root, 'usage.ts')
  await fs.writeFile(
    usagePath,
    `import { faker } from '@faker-js/faker'
import type { Animal } from './generated/types/Animal'
import type { Cat } from './generated/types/Cat'
import type { Category } from './generated/types/Category'
import type { DetailedCategory } from './generated/types/DetailedCategory'
import type { Pet } from './generated/types/Pet'
import { createAnimal } from './generated/mocks/createAnimal'
import { createCat } from './generated/mocks/createCat'
import { createCategory } from './generated/mocks/createCategory'
import { createDetailedCategory } from './generated/mocks/createDetailedCategory'
import { createPet } from './generated/mocks/createPet'

declare function acceptCategory(category: Category): void
acceptCategory(createCategory())
const nullable: Category | null | undefined = createCategory()
const nested: Pick<Pet, 'category'> = { category: createCategory() }
const categories: Category[] = [createCategory()]
const selected: Category | null = faker.helpers.arrayElement([createCategory(), null])
const multiple: Category[] = faker.helpers.multiple(() => createCategory())
const pet: Pet = createPet()
const detailed: DetailedCategory | null = createDetailedCategory()
const cat: Cat | null = createCat()
const animal: Animal = createAnimal()
const selectedAnimal: Animal | null = faker.helpers.arrayElement([createCat(), null])

const overridden = createCategory({ name: 'fixed' as const })
const literalName: 'fixed' = overridden.name
const requiredId: bigint = overridden.id
const overriddenIntersection = createDetailedCategory({ active: true as const })
const literalActive: true = overriddenIntersection.active
const intersectionId: bigint = overriddenIntersection.id
const overriddenCat = createCat({ id: 42 as const })
const literalCatId: 42 = overriddenCat.id
declare const data: Partial<Category>
const partial = createCategory(data)
const optionalId: bigint | undefined = partial.id
// @ts-expect-error Partial overrides can contain undefined for required properties.
const partialId: bigint = partial.id
// @ts-expect-error Overrides must match the schema property type.
createCategory({ id: 'invalid' })
const explicit: Category = createCategory<object>()
`,
  )

  const program = ts.createProgram([usagePath], {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    types: [],
  })
  expect(ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toStrictEqual([])
})
