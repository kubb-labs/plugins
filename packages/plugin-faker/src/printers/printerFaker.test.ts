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
      `"{"id": faker.number.int({ min: 1, max: 10 }),"name": faker.string.alpha(),"category": createCategory()}"`,
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

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toMatchInlineSnapshot(`"createEpisodeBase(data)"`)
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

  test('narrows discriminated oneOf variants to their own branch', () => {
    const makeVariant = (protocol: string, algorithms: Array<string>) =>
      ast.createSchema({
        type: 'object',
        properties: [
          ast.createProperty({ name: 'protocol', required: true, schema: ast.createSchema({ type: 'enum', primitive: 'string', enumValues: [protocol] }) }),
          ast.createProperty({ name: 'algorithm', schema: ast.createSchema({ type: 'enum', primitive: 'string', enumValues: algorithms }) }),
        ],
      })

    const node = ast.createSchema({
      type: 'union',
      discriminatorPropertyName: 'protocol',
      members: [makeVariant('udp', ['roundrobin', 'leastconn']), makeVariant('tcp', ['source'])],
    })

    const result = printerFaker({ resolver: resolverFaker, typeName: 'NodeBalancerConfig' }).print(node)

    // Each variant indexes through its own discriminated branch, not the bare union.
    expect(result).toContain('Extract<NonNullable<NodeBalancerConfig>, { "protocol": "udp" }>')
    expect(result).toContain('Extract<NonNullable<NodeBalancerConfig>, { "protocol": "tcp" }>')
    expect(result).not.toContain('NonNullable<NodeBalancerConfig>["algorithm"]')
  })

  test('falls back to any for undiscriminated unions of objects', () => {
    const node = ast.createSchema({
      type: 'union',
      members: [
        ast.createSchema({
          type: 'object',
          properties: [ast.createProperty({ name: 'a', schema: ast.createSchema({ type: 'enum', primitive: 'string', enumValues: ['x', 'y'] }) })],
        }),
      ],
    })

    const result = printerFaker({ resolver: resolverFaker, typeName: 'Thing' }).print(node)

    // The whole-union indexed-access type must not leak into the members.
    expect(result).not.toContain('NonNullable<Thing>')
    expect(result).toContain('faker.helpers.arrayElement<any>(["x", "y"])')
  })

  test('memoizing getters return a stable reference and data overrides replace the getter', () => {
    // Simulate the runtime object-literal pattern the printer generates for cyclic
    // properties (e.g. Cat.friends → Pet → Cat).  The getter must memoize its value
    // via Object.defineProperty so that:
    //   1. Accessing the same property twice returns the exact same reference.
    //   2. Passing `data` (partial override) replaces the getter with the supplied value.

    const mockFriends = [{ id: 1 }]

    // Mirrors the structure emitted by the printer's `object` handler.
    function makeCat(data?: Record<string, unknown>) {
      const defaultFakeData: Record<string, unknown> = {
        id: 42,
        get friends() {
          const _value = mockFriends
          Object.defineProperty(this, 'friends', { value: _value, configurable: true, writable: true, enumerable: true })
          return _value
        },
      }
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
        }
      }
      return defaultFakeData
    }

    // 1. Repeated property access must return the same reference (getter is memoized).
    const newCat = makeCat()
    expect(newCat.friends).toBe(newCat.friends)

    // 2. Passing data must override the getter with the supplied value.
    const overrideFriends = [{ id: 99 }]
    const catWithData = makeCat({ friends: overrideFriends })
    expect(catWithData.friends).toBe(overrideFriends)
  })

  test('emits memoizing getter for properties that participate in a cyclic dependency', () => {
    // Cat.friend → Pet which is cyclic; the getter must cache its computed value via
    // Object.defineProperty so that repeated access returns the same object instance.
    const cyclicSchemas = new Set(['Pet'])
    const node = ast.createSchema({
      type: 'object',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
        ast.createProperty({
          name: 'friend',
          schema: ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
        }),
      ],
    })

    const result = printerFaker({ resolver: resolverFaker, schemaName: 'Cat', cyclicSchemas }).print(node)

    // The cyclic property must use a memoizing getter
    expect(result).toContain('get friend()')
    expect(result).toContain('Object.defineProperty(this, "friend"')
    expect(result).toContain('configurable: true')
    // Non-cyclic properties must not use a getter
    expect(result).not.toContain('get id()')
  })
})
