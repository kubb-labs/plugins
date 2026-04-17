import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { resolverFaker } from '../resolvers/resolverFaker.ts'
import { printerFaker } from './printerFaker.ts'

describe('printerFaker', () => {
  test('renders object properties recursively', () => {
    const node = ast.createSchema({
      type: 'object',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer', min: 1, max: 10 }) }),
        ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ast.createProperty({
          name: 'category',
          schema: ast.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
        }),
      ],
    })

    expect(printerFaker({ resolver: resolverFaker, typeName: 'Pet', schemaName: 'Pet' }).print(node)).toMatchInlineSnapshot(
      `"{"id": faker.number.int({ min: 1, max: 10 }),"name": faker.string.alpha(),"category": category()}"`,
    )
  })

  test('renders enums with their target type', () => {
    const node = ast.createSchema({
      type: 'enum',
      name: 'PetStatus',
      primitive: 'string',
      enumValues: ['available', 'pending', 'sold'],
    })

    expect(printerFaker({ resolver: resolverFaker, typeName: 'PetStatus' }).print(node)).toMatchInlineSnapshot(
      `"faker.helpers.arrayElement<PetStatus>(["available", "pending", "sold"])"`,
    )
  })

  test('renders string dates with custom date parser', () => {
    const node = ast.createSchema({ type: 'date', representation: 'string' })

    expect(printerFaker({ resolver: resolverFaker, dateParser: 'dayjs' }).print(node)).toMatchInlineSnapshot(
      `"dayjs(faker.date.anytime()).format("YYYY-MM-DD")"`,
    )
  })

  test('renders regex matches with randexp', () => {
    const node = ast.createSchema({ type: 'string', pattern: '^[A-Z]+$' })

    expect(printerFaker({ resolver: resolverFaker, regexGenerator: 'randexp' }).print(node)).toMatchInlineSnapshot(`"new RandExp("^[A-Z]+$").gen()"`)
  })

  test('guards self refs', () => {
    const node = ast.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' })

    expect(printerFaker({ resolver: resolverFaker, schemaName: 'TreeNode' }).print(node)).toMatchInlineSnapshot(`"undefined as any"`)
  })

  test('does not re-resolve internal helper refs', () => {
    const node = ast.createSchema({ type: 'ref', name: 'showPetByIdResponseFaker' })

    expect(
      printerFaker({
        resolver: {
          ...resolverFaker,
          resolveName(name) {
            return `${this.default(name)}Faker`
          },
        },
      }).print(node),
    ).toMatchInlineSnapshot(`"showPetByIdResponseFaker(data)"`)
  })

  test('resolves ref names from ref path when name is missing', () => {
    const node = ast.createSchema({
      type: 'ref',
      ref: '#/components/schemas/EpisodeBase',
      schema: ast.createSchema({
        type: 'object',
        name: 'EpisodeBase',
        properties: [],
      }),
    })

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toMatchInlineSnapshot(`"episodeBase(data)"`)
  })

  test('uses tuple item types for nested enum members', () => {
    const node = ast.createSchema({
      type: 'tuple',
      items: [
        ast.createSchema({ type: 'integer' }),
        ast.createSchema({ type: 'string' }),
        ast.createSchema({
          type: 'enum',
          primitive: 'string',
          enumValues: ['NW', 'NE', 'SW', 'SE'],
        }),
      ],
    })

    expect(
      printerFaker({
        resolver: resolverFaker,
        typeName: `NonNullable<Address>["identifier"]`,
      }).print(node),
    ).toMatchInlineSnapshot(
      `"[faker.number.int(), faker.string.alpha(), faker.helpers.arrayElement<NonNullable<NonNullable<Address>["identifier"]>[2]>(["NW", "NE", "SW", "SE"])]"`,
    )
  })
})
