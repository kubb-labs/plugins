/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: just for testing */

import { describe, expect, it } from 'vitest'
import { format } from '#mocks'
import {
  appendJSDocToNode,
  createArrayDeclaration,
  createEnumDeclaration,
  createIntersectionDeclaration,
  createPropertySignature,
  createStringLiteral,
  createTypeDeclaration,
  createTypeLiteralNode,
  createUnionDeclaration,
  createUrlTemplateType,
  isTypeLiteral,
} from './factory.ts'

const formatTS = (elements: string | Array<string | undefined>) => {
  return format([elements].flat().filter(Boolean).join('\n'))
}

describe('Code Generation', () => {
  const node = "const hello = 'world'"

  it('should create array declaration', () => {
    // Default arrayType: 'array' - generates (string | number)[]
    expect(
      createArrayDeclaration({
        nodes: ['string', 'number'],
      }),
    ).toMatchSnapshot()

    // arrayType: 'generic' - generates Array<string | number>
    expect(
      createArrayDeclaration({
        nodes: ['string', 'number'],
        arrayType: 'generic',
      }),
    ).toMatchSnapshot()

    // Single node with default arrayType: 'array' - generates string[]
    expect(
      createArrayDeclaration({
        nodes: ['string'],
      }),
    ).toMatchSnapshot()

    // Single node with arrayType: 'generic' - generates Array<string>
    expect(
      createArrayDeclaration({
        nodes: ['string'],
        arrayType: 'generic',
      }),
    ).toMatchSnapshot()
  })

  it('should create intersection declaration', () => {
    expect(
      createIntersectionDeclaration({
        nodes: ['string', 'number'],
      }),
    ).toMatchSnapshot()
  })
  it('should create union declaration', () => {
    expect(
      createUnionDeclaration({
        nodes: ['string', 'number'],
      }),
    ).toMatchSnapshot()
  })
  it('should create property signature', () => {
    expect(
      createPropertySignature({
        name: 'hello',
        type: 'string',
      }),
    ).toMatchSnapshot()
  })

  it('should append JSDoc to node', async () => {
    expect(
      await formatTS(
        appendJSDocToNode({
          node,
          comments: ['@description description', undefined, '@example example'],
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        appendJSDocToNode({
          node,
          comments: [],
        }),
      ),
    ).toMatchSnapshot()
  })

  it('should quote enum keys that are not valid identifiers', async () => {
    // Enum values like `#VERCEL_SKIP` are not valid TS identifiers and must be emitted as
    // quoted string keys, otherwise they parse as illegal private identifiers.
    const output = await formatTS(
      createEnumDeclaration({
        type: 'asConst',
        name: 'hello',
        typeName: 'Hello',
        enums: [
          ['#VERCEL_SKIP', '#VERCEL_SKIP'],
          ['VALID_KEY', 'VALID_KEY'],
        ],
      }),
    )

    expect(output).toContain("'#VERCEL_SKIP': '#VERCEL_SKIP'")
    // the key is never emitted as a bare (unquoted) identifier
    expect(output).not.toMatch(/[\n{]\s*#VERCEL_SKIP:/)
    // valid identifiers stay unquoted
    expect(output).toContain("VALID_KEY: 'VALID_KEY'")
  })

  it('quotes #-prefixed hex color enum keys (regression for kubb-labs/kubb#3476)', async () => {
    const output = await formatTS(
      createEnumDeclaration({
        type: 'asConst',
        name: 'labelsColor',
        typeName: 'LabelsColor',
        enums: [
          ['#0099ff', '#0099ff'],
          ['#ccff9a', '#ccff9a'],
        ],
      }),
    )

    expect(output).toContain("'#0099ff': '#0099ff'")
    expect(output).toContain("'#ccff9a': '#ccff9a'")
    expect(output).not.toMatch(/[\n{]\s*#0099ff:/)
    expect(output).not.toMatch(/[\n{]\s*#ccff9a:/)
  })

  it('renders per-member descriptions as JSDoc on enum members', async () => {
    const output = await formatTS(
      createEnumDeclaration({
        type: 'enum',
        name: 'status',
        typeName: 'Status',
        enums: [
          ['active', 'active', 'The resource is active'],
          ['archived', 'archived', 'The resource is archived'],
        ],
      }),
    )

    expect(output).toContain('The resource is active')
    expect(output).toContain('The resource is archived')
    expect(output).toMatch(/\/\*\*[\s\S]*The resource is active[\s\S]*\*\/\s*active = 'active'/)
  })

  it('renders per-member descriptions as JSDoc on asConst members', async () => {
    const output = await formatTS(
      createEnumDeclaration({
        type: 'asConst',
        name: 'status',
        typeName: 'StatusKey',
        enums: [
          ['active', 'active', 'The resource is active'],
          ['archived', 'archived'],
        ],
      }),
    )

    expect(output).toMatch(/\/\*\*[\s\S]*The resource is active[\s\S]*\*\/\s*active: 'active'/)
    // members without a description stay un-annotated
    expect(output).not.toMatch(/\*\/\s*archived: 'archived'/)
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
  ])('should create URL template type for %s', (path, expected) => {
    expect(createUrlTemplateType(path)).toBe(expected)
  })
})

describe('createStringLiteral', () => {
  it.each([
    ['plain', "'plain'"],
    ["it's", "'it\\'s'"],
    ['back\\slash', "'back\\\\slash'"],
    ['line\nbreak', "'line\\nbreak'"],
    ['\u0001', "'\\u0001'"],
    ['café', "'café'"],
  ])('escapes %j', (text, expected) => {
    expect(createStringLiteral(text)).toBe(expected)
  })
})

describe('isTypeLiteral', () => {
  it.each([
    ['{}', true],
    ['{\n  a: string\n}', true],
    ["{\n  '}': string\n}", true],
    ["{\n  /** don't } */\n  a: string\n}", true],
    ['{\n  a: string\n} | null', false],
    ['{\n  a: string\n} & {\n  b: number\n}', false],
    ['string', false],
  ])('returns %s for %j', (type, expected) => {
    expect(isTypeLiteral(type)).toBe(expected)
  })
})

describe('parenthesization', () => {
  it.each([
    [['string | number'], '(string | number)[]'],
    [["'a|b'"], "'a|b'[]"],
    [['Record<string, number | null>'], 'Record<string, number | null>[]'],
    [['(a: string) => void'], '((a: string) => void)[]'],
  ])('wraps array items that need it: %j', (nodes, expected) => {
    expect(createArrayDeclaration({ nodes })).toBe(expected)
  })

  it('wraps union members of an intersection', () => {
    expect(createIntersectionDeclaration({ nodes: ['A | B', 'C'] })).toBe('(A | B) & C')
  })
})

describe('createTypeDeclaration', () => {
  it('prints an interface only for an object literal', () => {
    expect(createTypeDeclaration({ syntax: 'interface', name: 'Pet', type: '{\n  a: string\n}', comments: [], isExportable: true })).toBe(
      'export interface Pet {\n  a: string\n}',
    )
    expect(createTypeDeclaration({ syntax: 'interface', name: 'Pet', type: '{\n  a: string\n} | null', comments: [], isExportable: true })).toBe(
      'export type Pet = {\n  a: string\n} | null',
    )
  })
})

describe('createTypeLiteralNode', () => {
  it('indents nested object types', () => {
    expect(createTypeLiteralNode(['a: {\n  b: string\n}'])).toBe('{\n  a: {\n    b: string\n  }\n}')
  })
})

describe('createUrlTemplateType escaping', () => {
  it('escapes backticks and backslashes in path segments', () => {
    expect(createUrlTemplateType('/a`b\\c/{id}')).toBe('`/a\\`b\\\\c/${string}`')
  })
})
