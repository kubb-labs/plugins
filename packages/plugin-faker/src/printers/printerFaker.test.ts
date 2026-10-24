import { ast, Resolver } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { resolverFaker } from '../resolvers/resolverFaker.ts'
import { printerFaker } from './printerFaker.ts'

describe('printerFaker', () => {
  test('falls back to the base string printer from a node override', () => {
    const printer = printerFaker({
      resolver: resolverFaker,
      nodes: {
        string(node) {
          if (node.title === 'Note') return 'faker.lorem.lines()'

          return this.base(node)
        },
      },
    })

    expect(printer.print(ast.factory.createSchema({ type: 'string', title: 'Note' }))).toBe('faker.lorem.lines()')
    expect(printer.print(ast.factory.createSchema({ type: 'string', title: 'Name' }))).toBe('faker.string.alpha()')

    const object = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({ name: 'note', schema: ast.factory.createSchema({ type: 'string', title: 'Note' }) }),
        ast.factory.createProperty({ name: 'name', schema: ast.factory.createSchema({ type: 'string', title: 'Name' }) }),
      ],
    })

    expect(printer.print(object)).toMatchInlineSnapshot(`
      "{
        note: faker.lorem.lines(),
        name: faker.string.alpha(),
      }"
    `)
  })

  test('mocks a string int64 as digits', () => {
    const node = ast.factory.createSchema({ type: 'string', format: 'int64' })

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toMatchInlineSnapshot(`"faker.number.bigInt().toString()"`)
  })

  test('mocks a string int32 within the 32-bit range', () => {
    const node = ast.factory.createSchema({ type: 'string', format: 'int32' })

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toMatchInlineSnapshot(`"faker.number.int({ max: 2147483647 }).toString()"`)
  })

  test('does not re-resolve internal helper refs', () => {
    const node = ast.factory.createSchema({ type: 'ref', name: 'showPetByIdResponseFaker' })

    expect(
      printerFaker({
        resolver: Resolver.merge(resolverFaker, {
          name: (name: string) => `${resolverFaker.name(name)}Faker`,
        }),
      }).print(node),
    ).toMatchInlineSnapshot(`"showPetByIdResponseFaker(data)"`)
  })

  test('resolves ref names from ref path when name is missing', () => {
    const node = ast.factory.createSchema({
      type: 'ref',
      ref: '#/components/schemas/EpisodeBase',
      schema: ast.factory.createSchema({
        type: 'object',
        name: 'EpisodeBase',
        properties: [],
      }),
    })

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toMatchInlineSnapshot(`"createEpisodeBase(data)"`)
  })

  test('resolves a collided ref to its renamed name via targetName', () => {
    const node = ast.factory.createSchema({ type: 'ref', name: 'Order', ref: '#/components/schemas/Order', targetName: 'OrderSchema' })

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toMatchInlineSnapshot(`"createOrderSchema(data)"`)
  })

  test('calls a ref to an untyped schema without data', () => {
    const anyJson = ast.factory.createSchema({ type: 'unknown' })
    const eventPayload = ast.factory.createSchema({ type: 'ref', name: 'AnyJson', ref: '#/components/schemas/AnyJson', schema: anyJson })
    const node = ast.factory.createSchema({ type: 'ref', name: 'EventPayload', ref: '#/components/schemas/EventPayload', schema: eventPayload })

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toBe('createEventPayload()')
  })

  test('uses tuple item types for nested enum members', () => {
    const node = ast.factory.createSchema({
      type: 'tuple',
      items: [
        ast.factory.createSchema({ type: 'integer' }),
        ast.factory.createSchema({ type: 'string' }),
        ast.factory.createSchema({
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
      `"[faker.number.int(), faker.string.alpha(), faker.helpers.arrayElement<NonNullable<NonNullable<Address>["identifier"]>[2]>(['NW', 'NE', 'SW', 'SE'])]"`,
    )
  })

  test('narrows discriminated oneOf variants to their own branch', () => {
    const makeVariant = (protocol: string, algorithms: Array<string>) =>
      ast.factory.createSchema({
        type: 'object',
        properties: [
          ast.factory.createProperty({
            name: 'protocol',
            required: true,
            schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: [protocol] }),
          }),
          ast.factory.createProperty({ name: 'algorithm', schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: algorithms }) }),
        ],
      })

    const node = ast.factory.createSchema({
      type: 'union',
      discriminatorPropertyName: 'protocol',
      members: [makeVariant('udp', ['random', 'rotate']), makeVariant('tcp', ['source'])],
    })

    const result = printerFaker({ resolver: resolverFaker, typeName: 'NodeBalancerConfig' }).print(node)

    // Each variant indexes through its own discriminated branch, not the bare union.
    expect(result).toContain(`Extract<NonNullable<NodeBalancerConfig>, { "protocol": 'udp' }>`)
    expect(result).toContain(`Extract<NonNullable<NodeBalancerConfig>, { "protocol": 'tcp' }>`)
    expect(result).not.toContain('NonNullable<NodeBalancerConfig>["algorithm"]')
  })

  test('narrows variants with an optional discriminator as optional', () => {
    const makeVariant = (strategy: string) =>
      ast.factory.createSchema({
        type: 'object',
        properties: [
          ast.factory.createProperty({ name: 'strategy', schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: [strategy] }) }),
        ],
      })

    const node = ast.factory.createSchema({
      type: 'union',
      discriminatorPropertyName: 'strategy',
      members: [makeVariant('constant'), makeVariant('exponential')],
    })

    const result = printerFaker({ resolver: resolverFaker, typeName: 'Backoff' }).print(node)

    expect(result).toContain(`Extract<NonNullable<Backoff>, { "strategy"?: 'constant' }>`)
    expect(result).toContain(`Extract<NonNullable<Backoff>, { "strategy"?: 'exponential' }>`)
  })

  test('narrows referenced discriminated oneOf variants to their own branch', () => {
    const makeVariant = (name: string, petType: string) => {
      const schema = ast.factory.createSchema({
        type: 'object',
        name,
        properties: [
          ast.factory.createProperty({
            name: 'pet_type',
            required: true,
            schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: [petType] }),
          }),
        ],
      })

      return ast.factory.createSchema({
        type: 'intersection',
        members: [
          ast.factory.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}`, schema }),
          ast.factory.createSchema({
            type: 'object',
            properties: [
              ast.factory.createProperty({
                name: 'pet_type',
                required: true,
                schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: [petType] }),
              }),
            ],
          }),
        ],
      })
    }

    const node = ast.factory.createSchema({
      type: 'union',
      discriminatorPropertyName: 'pet_type',
      members: [makeVariant('Cat', 'cat'), makeVariant('Dog', 'dog')],
    })

    const result = printerFaker({ resolver: resolverFaker, typeName: 'AddPetBody' }).print(node)

    expect(result).toContain(`Extract<NonNullable<AddPetBody>, { "pet_type": 'cat' }>`)
    expect(result).toContain(`Extract<NonNullable<AddPetBody>, { "pet_type": 'dog' }>`)
    expect(result).toContain('createCat()')
    expect(result).toContain('createDog()')
  })

  test('guards member property access in non-discriminated unions of objects', () => {
    // A `oneOf` without a discriminator carries `+order` on only one branch, so a plain
    // `NonNullable<Filter>["+order"]` would be a TS2339. Members index via
    // `(NonNullable<Filter> & Record<"+order", unknown>)["+order"]`, which stays valid and
    // resolves to `unknown` rather than `any`.
    const node = ast.factory.createSchema({
      type: 'union',
      name: 'Filter',
      members: [
        ast.factory.createSchema({ type: 'object', properties: [] }),
        ast.factory.createSchema({
          type: 'object',
          properties: [
            ast.factory.createProperty({
              name: '+order',
              schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['asc', 'desc'] }),
            }),
          ],
        }),
      ],
    })

    expect(printerFaker({ resolver: resolverFaker, typeName: 'Filter', schemaName: 'Filter' }).print(node)).toMatchInlineSnapshot(
      `
      "faker.helpers.arrayElement([{}, {
        '+order': faker.helpers.arrayElement<(NonNullable<Filter> & Record<"+order", unknown>)["+order"]>(['asc', 'desc']),
      }])"
    `,
    )
  })

  test('renders object refs in unions without explicit type arguments', () => {
    const makeVariant = (name: string, petType: string) => {
      const schema = ast.factory.createSchema({
        type: 'object',
        name,
        properties: [
          ast.factory.createProperty({
            name: 'petType',
            required: true,
            schema: ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: [petType] }),
          }),
        ],
      })

      return ast.factory.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}`, schema })
    }

    const node = ast.factory.createSchema({
      type: 'union',
      name: 'Pet',
      members: [makeVariant('Cat', 'cat'), makeVariant('Dog', 'dog')],
    })

    expect(printerFaker({ resolver: resolverFaker, typeName: 'Pet', schemaName: 'Pet' }).print(node)).toBe(
      'faker.helpers.arrayElement([createCat(), createDog()])',
    )
  })

  test('drops shapeless allOf members instead of spreading undefined', () => {
    // `allOf: [{ $ref: EquipmentCategory }, { description }]` — the metadata-only member has no
    // shape and mocks to `undefined`. It must be dropped, not spread as `{...x, ...undefined}`.
    const node = ast.factory.createSchema({
      type: 'intersection',
      members: [
        ast.factory.createSchema({ type: 'ref', name: 'EquipmentCategory', ref: '#/components/schemas/EquipmentCategory' }),
        ast.factory.createSchema({ type: 'unknown' }),
      ],
    })

    expect(printerFaker({ resolver: resolverFaker }).print(node)).toMatchInlineSnapshot(`"createEquipmentCategory()"`)
  })

  test('emits memoizing getter for properties that participate in a cyclic dependency', () => {
    // Cat.friend → Pet which is cyclic; the getter must cache its computed value via
    // Object.defineProperty so that repeated access returns the same object instance.
    const cyclicSchemas = new Set(['Pet'])
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
        ast.factory.createProperty({
          name: 'friend',
          schema: ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
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
