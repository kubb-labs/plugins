import { describe, expect, it } from 'vitest'
import { applyCommentLevel, buildJSDoc, buildList, buildObject, lazyGetter, objectKey } from './codegen.ts'

describe('buildJSDoc', () => {
  it('builds a comment block from lines', () => {
    expect(buildJSDoc(['@type string', '@example hello'])).toBe('/**\n   * @type string\n   * @example hello\n   */\n  ')
  })

  it('returns the fallback when there are no comments', () => {
    expect(buildJSDoc([])).toBe('  ')
    expect(buildJSDoc([], { fallback: '' })).toBe('')
  })
})

describe('applyCommentLevel', () => {
  it('returns every comment untouched at full', () => {
    const comments = ['@description One sentence. And a second one.', '@type string']

    expect(applyCommentLevel(comments, 'full')).toStrictEqual(comments)
  })

  it('drops every comment at none', () => {
    expect(applyCommentLevel(['@description Anything', '@type string'], 'none')).toStrictEqual([])
  })

  it('keeps only the first sentence at brief', () => {
    expect(applyCommentLevel(['@description The identifier. Referenced in API endpoints. And more.'], 'brief')).toStrictEqual(['@description The identifier.'])
  })

  it('leaves a description that is already one short sentence alone', () => {
    expect(applyCommentLevel(['@description The name of the API key'], 'brief')).toStrictEqual(['@description The name of the API key'])
  })

  it('cuts at the first sentence that ends on a newline', () => {
    expect(applyCommentLevel(['@description The chunk of bytes for this Part.\nSecond paragraph.'], 'brief')).toStrictEqual([
      '@description The chunk of bytes for this Part.',
    ])
  })

  it('keeps a whole sentence that runs a little past the cap', () => {
    const description =
      '@description A citation within the message that points to a specific quote from a specific File associated with the assistant or the message. Ignored otherwise.'

    expect(applyCommentLevel([description], 'brief')).toStrictEqual([
      '@description A citation within the message that points to a specific quote from a specific File associated with the assistant or the message.',
    ])
  })

  it('caps a long opening sentence at a word boundary', () => {
    const long = `@description ${'word '.repeat(40).trim()}`
    const [result] = applyCommentLevel([long], 'brief')

    expect(result?.endsWith('…')).toBe(true)
    expect(result?.includes('word word')).toBe(true)
    expect(result?.length).toBeLessThanOrEqual('@description '.length + 120)
  })

  it('does not treat an abbreviation as the end of a sentence', () => {
    expect(applyCommentLevel(['@description The city and state, e.g. San Francisco, CA. Used for weather lookups.'], 'brief')).toStrictEqual([
      '@description The city and state, e.g. San Francisco, CA.',
    ])
  })

  it('does not cut inside an open bracket', () => {
    expect(applyCommentLevel(['@description The role of the message (e.g. `system`, `user`). Defaults to `user`.'], 'brief')).toStrictEqual([
      '@description The role of the message (e.g. `system`, `user`).',
    ])
  })

  it('backs a cap off a half-written markdown link', () => {
    const description =
      '@description The identifier of the run step this delta belongs to, which you hand back to the [retrieve run step](https://platform.example.com/docs/api/runs) endpoint'

    expect(applyCommentLevel([description], 'brief')).toStrictEqual([
      '@description The identifier of the run step this delta belongs to, which you hand back to the…',
    ])
  })

  it('backs a cap off a half-written code span', () => {
    const description =
      '@description An object specifying the format that the model must output, for example `{ "type": "json_schema", "strict": true, "name": "reply" }` and nothing more than that'

    expect(applyCommentLevel([description], 'brief')).toStrictEqual(['@description An object specifying the format that the model must output, for example…'])
  })

  it('leaves tags other than description alone at brief', () => {
    expect(applyCommentLevel(['@summary Show a pet. And more.', '@type string'], 'brief')).toStrictEqual(['@summary Show a pet. And more.', '@type string'])
  })
})

describe('objectKey', () => {
  it('leaves valid identifiers unquoted', () => {
    expect(objectKey('id')).toMatchInlineSnapshot(`"id"`)
  })

  it('leaves reserved words and globals unquoted', () => {
    expect(objectKey('name')).toMatchInlineSnapshot(`"name"`)
    expect(objectKey('class')).toMatchInlineSnapshot(`"class"`)
  })

  it('single-quotes keys that are not valid identifiers', () => {
    expect(objectKey('x-total')).toMatchInlineSnapshot(`"'x-total'"`)
    expect(objectKey('200')).toMatchInlineSnapshot(`"'200'"`)
  })
})

describe('buildObject', () => {
  it('returns an empty object literal for no entries', () => {
    expect(buildObject([])).toMatchInlineSnapshot(`"{}"`)
  })

  it('indents entries and adds a trailing comma', () => {
    expect(buildObject(['id: z.number()', 'name: z.string()'])).toMatchInlineSnapshot(`
      "{
        id: z.number(),
        name: z.string(),
      }"
    `)
  })

  it('indents a nested object cumulatively', () => {
    const address = `address: ${buildObject(['street: z.string()'])}`
    expect(buildObject(['id: z.number()', address])).toMatchInlineSnapshot(`
      "{
        id: z.number(),
        address: {
          street: z.string(),
        },
      }"
    `)
  })
})

describe('buildList', () => {
  it('returns an empty list for no items', () => {
    expect(buildList([])).toMatchInlineSnapshot(`"[]"`)
  })

  it('keeps single-line items inline', () => {
    expect(buildList(['z.string()', 'z.number()'])).toMatchInlineSnapshot(`"[z.string(), z.number()]"`)
  })

  it('wraps and indents when an item spans multiple lines', () => {
    const member = buildObject(['id: z.number()'])
    expect(buildList([`z.object(${member})`, 'z.string()'])).toMatchInlineSnapshot(`
      "[
        z.object({
          id: z.number(),
        }),
        z.string(),
      ]"
    `)
  })

  it('uses custom brackets', () => {
    expect(buildList(['a', 'b'], ['(', ')'])).toMatchInlineSnapshot(`"(a, b)"`)
  })
})

describe('lazyGetter', () => {
  it('emits a getter for a valid identifier key', () => {
    expect(lazyGetter({ name: 'parent', body: 'z.lazy(() => Pet)' })).toBe('get parent() { return z.lazy(() => Pet) }')
  })

  it('quotes a key that is not a valid identifier', () => {
    expect(lazyGetter({ name: 'x-total', body: 'z.number()' })).toBe("get 'x-total'() { return z.number() }")
  })
})
