/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: just for testing */

import { describe, expect, it } from 'vitest'
import { format } from '#mocks'
import {
  appendJSDocToNode,
  constToTypeNode,
  createArrayDeclaration,
  createEnumDeclaration,
  createIntersectionDeclaration,
  createPropertySignature,
  createRaw,
  createTypeDeclaration,
  createTypeLiteralNode,
  createTypeReferenceNode,
  createUnionDeclaration,
  createUrlTemplateType,
  keywordTypeNodes,
  print,
} from './factory.ts'

const { string, number } = keywordTypeNodes

describe('Code Generation', () => {
  it.each([
    ['array', [string, number], '(string | number)[]'],
    ['generic', [string, number], 'Array<string | number>'],
    ['array', [string], 'string[]'],
    ['generic', [string], 'Array<string>'],
  ] as const)('should create a %s array declaration of %#', (arrayType, nodes, expected) => {
    expect(print(createArrayDeclaration({ nodes: [...nodes], arrayType }))).toBe(expected)
  })

  it('should create intersection and union declarations', () => {
    expect(print(createIntersectionDeclaration({ nodes: [string, number] })!)).toBe('string & number')
    expect(print(createUnionDeclaration({ nodes: [string, number] }))).toBe('string | number')
  })

  it('should create property signatures', () => {
    expect(print(createTypeLiteralNode([createPropertySignature({ name: 'hello', type: string, questionToken: true, readOnly: true })]))).toBe(
      '{\n  readonly hello?: string;\n}',
    )
  })

  it('should append JSDoc to node', async () => {
    const type = createTypeDeclaration({ syntax: 'type', name: 'Hello', type: string, comments: ['@description description', undefined, '@example example'] })

    expect(await format(type)).toBe(['/**', ' * @description description', ' * @example example', ' */', 'type Hello = string', ''].join('\n'))
    expect(createTypeDeclaration({ syntax: 'type', name: 'Hello', type: string, comments: [] })).toBe('type Hello = string;')
  })

  it('escapes a closing comment marker inside JSDoc', () => {
    expect(print(appendJSDocToNode({ node: string, comments: ['a */ b'] }))).toContain('a *\\/ b')
  })

  it('should quote enum keys that are not valid identifiers', async () => {
    // Enum values like `#VERCEL_SKIP` are not valid TS identifiers and must be emitted as
    // quoted string keys, otherwise they parse as illegal private identifiers.
    const output = await format(
      createEnumDeclaration({
        type: 'asConst',
        name: 'hello',
        typeName: 'Hello',
        enums: [
          ['#VERCEL_SKIP', '#VERCEL_SKIP'],
          ['VALID_KEY', 'VALID_KEY'],
        ],
      }).join('\n'),
    )

    expect(output).toContain("'#VERCEL_SKIP': '#VERCEL_SKIP'")
    // the key is never emitted as a bare (unquoted) identifier
    expect(output).not.toMatch(/[\n{]\s*#VERCEL_SKIP:/)
    // valid identifiers stay unquoted
    expect(output).toContain("VALID_KEY: 'VALID_KEY'")
  })

  it('quotes #-prefixed hex color enum keys (regression for kubb-labs/kubb#3476)', async () => {
    const output = await format(
      createEnumDeclaration({
        type: 'asConst',
        name: 'labelsColor',
        typeName: 'LabelsColor',
        enums: [
          ['#0099ff', '#0099ff'],
          ['#ccff9a', '#ccff9a'],
        ],
      }).join('\n'),
    )

    expect(output).toContain("'#0099ff': '#0099ff'")
    expect(output).toContain("'#ccff9a': '#ccff9a'")
    expect(output).not.toMatch(/[\n{]\s*#0099ff:/)
    expect(output).not.toMatch(/[\n{]\s*#ccff9a:/)
  })

  it('renders per-member descriptions as JSDoc on enum members', () => {
    const [, output] = createEnumDeclaration({
      type: 'enum',
      name: 'status',
      typeName: 'Status',
      enums: [
        ['active', 'active', 'The resource is active'],
        ['archived', 'archived', 'The resource is archived'],
      ],
    })

    expect(output).toContain('The resource is archived')
    expect(output).toMatch(/\/\*\*[\s\S]*The resource is active[\s\S]*\*\/\s*active = 'active'/)
  })

  it('renders per-member descriptions as JSDoc on asConst members', () => {
    const [output] = createEnumDeclaration({
      type: 'asConst',
      name: 'status',
      typeName: 'StatusKey',
      enums: [
        ['active', 'active', 'The resource is active'],
        ['archived', 'archived'],
      ],
    })

    expect(output).toMatch(/\/\*\*[\s\S]*The resource is active[\s\S]*\*\/\s*active: 'active'/)
    // members without a description stay un-annotated
    expect(output).not.toMatch(/\*\/\s*archived: 'archived'/)
  })

  it('prints an asConst enum with one member per line and its key type', () => {
    expect(createEnumDeclaration({ type: 'asConst', name: 'petStatus', typeName: 'PetStatusKey', enums: [['available', 'available']] })).toEqual([
      "export const petStatus = {\n  available: 'available',\n} as const;",
      'export type PetStatusKey = (typeof petStatus)[keyof typeof petStatus];',
    ])
  })
})

describe('createUrlTemplateType', () => {
  it.each([
    ['/pets', "'/pets'"],
    ['/pets/{petId}', '`/pets/${string}`'],
    ['/pets/{petId}/owner/{ownerId}', '`/pets/${string}/owner/${string}`'],
    ['/{category}/pets', '`/${string}/pets`'],
    ['/user/{username}', '`/user/${string}`'],
    ['/pet/findByStatus/{step_id}', '`/pet/findByStatus/${string}`'],
    ['/api/{version}/{resource}', '`/api/${string}/${string}`'],
    ['/pets/:petId', '`/pets/${string}`'],
    ['/store/:storeId/order/:orderId', '`/store/${string}/order/${string}`'],
    ['/pets/:petId/photos', '`/pets/${string}/photos`'],
    ['/a`b\\c/{id}', '`/a\\`b\\\\c/${string}`'],
  ])('should create URL template type for %s', (path, expected) => {
    expect(print(createUrlTemplateType(path))).toBe(expected)
  })
})

describe('string literals', () => {
  it.each([
    ['plain', "'plain'"],
    ["it's", "'it\\'s'"],
    ['back\\slash', "'back\\\\slash'"],
    ['line\nbreak', "'line\\nbreak'"],
    ['café', "'café'"],
  ])('escapes %j', (text, expected) => {
    expect(print(constToTypeNode(text, 'string')!)).toBe(expected)
  })
})

describe('parenthesization', () => {
  const union = createUnionDeclaration({ nodes: [createTypeReferenceNode('A'), createTypeReferenceNode('B')] })

  it('wraps a union array item and a union intersection member', () => {
    expect(print(createArrayDeclaration({ nodes: [union] }))).toBe('(A | B)[]')
    expect(print(createIntersectionDeclaration({ nodes: [union, createTypeReferenceNode('C')] })!)).toBe('(A | B) & C')
  })

  it.each([
    ['Date', 'Date[]'],
    ['A | B', '(A | B)[]'],
    ['(a: string) => void', '((a: string) => void)[]'],
  ])('keeps raw override output %j intact inside an array', (text, expected) => {
    expect(print(createArrayDeclaration({ nodes: [createRaw(text)] }))).toBe(expected)
  })
})

describe('createTypeDeclaration', () => {
  it('prints an interface only for an object literal', () => {
    const literal = createTypeLiteralNode([createPropertySignature({ name: 'a', type: string })])

    expect(createTypeDeclaration({ syntax: 'interface', name: 'Pet', type: literal, comments: [], isExportable: true })).toBe(
      'export interface Pet {\n  a: string;\n}',
    )
    expect(
      createTypeDeclaration({
        syntax: 'interface',
        name: 'Pet',
        type: createUnionDeclaration({ nodes: [literal, keywordTypeNodes.null] }),
        comments: [],
        isExportable: true,
      }),
    ).toBe('export type Pet = {\n  a: string;\n} | null;')
  })

  it('indents nested object types', () => {
    const nested = createTypeLiteralNode([createPropertySignature({ name: 'b', type: string })])

    expect(print(createTypeLiteralNode([createPropertySignature({ name: 'a', type: nested })]))).toBe('{\n  a: {\n    b: string;\n  };\n}')
  })
})
