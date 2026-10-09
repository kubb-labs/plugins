import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import * as fakerModule from '@faker-js/faker'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { ast, type Config, Diagnostics, type KubbHooks, fsStorage } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import ts from 'typescript'
import { describe, expect, onTestFinished, test, vi } from 'vitest'

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

test.each([undefined, 'inferred', 'schema'] as const)('factory typing with typeMode %s', async (typeMode) => {
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
          Order: {
            type: 'object',
            properties: {
              quantity: { type: 'integer' },
              complete: { type: 'boolean' },
              shipDate: { type: 'string', nullable: true },
            },
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
    plugins: [pluginTs({ output: { path: 'types' } }), pluginFaker({ output: { path: 'mocks' }, typeMode })],
  }).safeBuild()

  expect(Diagnostics.hasError(diagnostics)).toBe(false)
  const catSource = await fs.readFile(path.join(root, 'generated/mocks/createCat.ts'), 'utf8')
  expect(catSource).toContain('get friend()')

  const createAnimal = vi.fn(() => ({ id: 1 }))
  const exports: { createCat?: (data?: { id?: number; friend?: { id: number } }) => { id: number; friend: { id: number } } } = {}
  const compiledCat = ts.transpileModule(catSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function('require', 'exports', compiledCat)((name: string) => {
    if (name === '@faker-js/faker') return fakerModule
    if (name === './createAnimal') return { createAnimal }
    throw new Error(`Unexpected generated import: ${name}`)
  }, exports)
  const overriddenCat = exports.createCat!({ id: 42, friend: { id: 7 } })
  expect(overriddenCat).toEqual({ id: 42, friend: { id: 7 } })
  expect(createAnimal).not.toHaveBeenCalled()
  const lazyCat = exports.createCat!()
  expect(createAnimal).not.toHaveBeenCalled()
  expect(lazyCat.friend).toEqual({ id: 1 })
  expect(lazyCat.friend).toEqual({ id: 1 })
  expect(createAnimal).toHaveBeenCalledTimes(1)
  lazyCat.friend = { id: 2 }
  expect(lazyCat.friend).toEqual({ id: 2 })

  const usagePath = path.join(root, 'usage.ts')
  await fs.writeFile(
    usagePath,
    `import { faker } from '@faker-js/faker'
import type { Animal } from './generated/types/Animal'
import type { Cat } from './generated/types/Cat'
import type { Category } from './generated/types/Category'
import type { DetailedCategory } from './generated/types/DetailedCategory'
import type { Pet } from './generated/types/Pet'
import type { Order } from './generated/types/Order'
import { createAnimal } from './generated/mocks/createAnimal'
import { createCat } from './generated/mocks/createCat'
import { createCategory } from './generated/mocks/createCategory'
import { createDetailedCategory } from './generated/mocks/createDetailedCategory'
import { createPet } from './generated/mocks/createPet'
import { createOrder } from './generated/mocks/createOrder'

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

// @ts-expect-error Overrides must match the schema property type.
createCategory({ id: 'invalid' })

${
  typeMode === 'schema'
    ? `
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type Expect<T extends true> = T
type OrderReturn = Expect<Equal<ReturnType<typeof createOrder>, Order>>
type OrderInput = Expect<Equal<Parameters<typeof createOrder>[0], Partial<Order> | undefined>>
const order = createOrder({ quantity: 2, complete: true })
// @ts-expect-error Schema mode does not preserve the literal override type.
const literalComplete: true = order.complete
order.complete = false
order.complete = true
order.shipDate = null
order.shipDate = '2026-10-08'
order.quantity = undefined
// @ts-expect-error Generated optional properties stay optional in the model.
const requiredQuantity: number = createOrder().quantity
// @ts-expect-error Generated nullable properties keep the model's nullability.
const requiredShipDate: string = createOrder().shipDate
// @ts-expect-error Unknown inline properties are rejected.
createOrder({ quantity: 2, foo: '' })
// @ts-expect-error Property values must match the model.
createOrder({ complete: 'invalid' })
const overriddenIntersection = createDetailedCategory({ active: true })
overriddenIntersection.active = false
const overriddenCat = createCat({ id: 42 })
overriddenCat.id = 43
type IntersectionReturn = Expect<Equal<ReturnType<typeof createDetailedCategory>, DetailedCategory>>
type CatReturn = Expect<Equal<ReturnType<typeof createCat>, Cat>>
declare const data: Partial<Category>
const partialId: bigint = createCategory(data).id
`
    : `
const order = createOrder({ quantity: 2, complete: true })
const literalComplete: true = order.complete
// @ts-expect-error Inferred mode preserves the literal override type.
order.complete = false
const generatedQuantity: number = createOrder().quantity
const generatedShipDate: string = createOrder().shipDate
createOrder({ quantity: 2, foo: '' })
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
const explicit: Category = createCategory<object>()
`
}
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

test('applies schema typing overrides to schemas and all operation object factories', async () => {
  const root = await fs.mkdtemp(path.join(__dirname, '.faker-overrides-'))
  onTestFinished(() => fs.rm(root, { recursive: true, force: true }))
  const orderSchema = { type: 'object' as const, properties: { quantity: { type: 'integer' as const }, complete: { type: 'boolean' as const } } }
  const { diagnostics } = await createKubb({
    root,
    input: {
      openapi: '3.0.3',
      info: { title: 'Faker type mode overrides', version: '1.0.0' },
      paths: {
        '/orders/{orderId}': {
          post: {
            operationId: 'createOrder',
            parameters: [
              { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'complete', in: 'query', schema: { type: 'boolean' } },
              { name: 'active', in: 'header', schema: { type: 'boolean' } },
            ],
            requestBody: { required: true, content: { 'application/json': { schema: orderSchema } } },
            responses: { 200: { description: 'Created order', content: { 'application/json': { schema: orderSchema } } } },
          },
        },
      },
      components: {
        schemas: {
          Order: orderSchema,
          Category: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    },
    adapter: adapterOas(),
    parsers: [parserTs()],
    storage: fsStorage(),
    output: { path: 'generated', clean: true, format: false, lint: false },
    plugins: [
      pluginTs({ output: { path: 'types' } }),
      pluginFaker({
        output: { path: 'mocks' },
        override: [
          { type: 'schemaName', pattern: 'Order', options: { typeMode: 'schema' } },
          { type: 'operationId', pattern: 'createOrder', options: { typeMode: 'schema' } },
        ],
      }),
    ],
  }).safeBuild()
  expect(Diagnostics.hasError(diagnostics)).toBe(false)
  const categorySource = await fs.readFile(path.join(root, 'generated/mocks/createCategory.ts'), 'utf8')
  expect(categorySource).toContain('createCategory<TData extends Partial<Category> = object>')
  const operationSource = await fs.readFile(path.join(root, 'generated/mocks/createCreateOrder.ts'), 'utf8')
  for (const suffix of ['Path', 'Query', 'Headers', 'Body', 'Status200', 'Response']) {
    expect(operationSource).toContain(`createCreateOrder${suffix}(data?: Partial<CreateOrder${suffix}>): CreateOrder${suffix}`)
  }

  const usagePath = path.join(root, 'usage.ts')
  await fs.writeFile(
    usagePath,
    `
import { createOrder } from './generated/mocks/createOrder'
import { createCreateOrderPath, createCreateOrderQuery, createCreateOrderHeaders, createCreateOrderBody, createCreateOrderStatus200, createCreateOrderResponse } from './generated/mocks/createCreateOrder'
createOrder({ complete: true }).complete = false
createCreateOrderPath({ orderId: 'first' }).orderId = 'second'
createCreateOrderQuery({ complete: true }).complete = false
createCreateOrderHeaders({ active: true }).active = false
createCreateOrderBody({ complete: true }).complete = false
createCreateOrderStatus200({ complete: true }).complete = false
createCreateOrderResponse({ complete: true }).complete = false
// @ts-expect-error Overrides reject unknown inline properties.
createCreateOrderBody({ complete: true, foo: '' })
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
