/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: just for testing */

import { parserTs } from '@kubb/parser-ts'
import ts from '@typescript/typescript6'
import { describe, expect, it } from 'vitest'
import { format } from '#mocks'
import {
  appendJSDocToNode,
  createArrayDeclaration,
  createEnumDeclaration,
  createIntersectionDeclaration,
  createPropertySignature,
  createUnionDeclaration,
  createUrlTemplateType,
} from './factory.ts'

const { factory } = ts

const formatTS = (elements: ts.Node | Array<ts.Node | undefined>) => {
  return format(parserTs().print(...[elements].flat().filter(Boolean)))
}

describe('Code Generation', () => {
  const node = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier('hello'), undefined, undefined, factory.createStringLiteral('world'))],
      ts.NodeFlags.Const,
    ),
  )

  it('should create array declaration', () => {
    // Default arrayType: 'array' - generates (string | number)[]
    expect(
      parserTs().print(
        createArrayDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        })!,
      ),
    ).toMatchSnapshot()

    // arrayType: 'generic' - generates Array<string | number>
    expect(
      parserTs().print(
        createArrayDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
          arrayType: 'generic',
        })!,
      ),
    ).toMatchSnapshot()

    // Single node with default arrayType: 'array' - generates string[]
    expect(
      parserTs().print(
        createArrayDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)],
        })!,
      ),
    ).toMatchSnapshot()

    // Single node with arrayType: 'generic' - generates Array<string>
    expect(
      parserTs().print(
        createArrayDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)],
          arrayType: 'generic',
        })!,
      ),
    ).toMatchSnapshot()
  })

  it('should create intersection declaration', () => {
    expect(
      parserTs().print(
        createIntersectionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        })!,
      ),
    ).toMatchSnapshot()
  })
  it('should create union declaration', () => {
    expect(
      parserTs().print(
        createUnionDeclaration({
          nodes: [factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
        })!,
      ),
    ).toMatchSnapshot()
  })
  it('should create property signature', () => {
    expect(
      parserTs().print(
        createPropertySignature({
          modifiers: [factory.createModifier(ts.SyntaxKind.ConstKeyword)],
          name: 'hello',
          type: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        })!,
      ),
    ).toMatchSnapshot()
  })

  it('should append JSDoc to node', async () => {
    expect(
      await formatTS(
        appendJSDocToNode({
          node: { ...node },
          comments: ['@description description', undefined, '@example example'],
        }),
      ),
    ).toMatchSnapshot()

    expect(
      await formatTS(
        appendJSDocToNode({
          node: { ...node },
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
    ['/pets', '"/pets"'],
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
    expect(parserTs().print(createUrlTemplateType(path)).trim()).toBe(expected)
  })
})
