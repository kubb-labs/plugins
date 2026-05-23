import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { buildTransformerBody, collectDirectDateRefs, containsDateField, serializeFnName, transformFnName } from './dateTransformer.ts'

const dateLeaf = ast.createSchema({ type: 'date', representation: 'date', format: 'date-time' })
const dateOnlyLeaf = ast.createSchema({ type: 'date', representation: 'date', format: 'date' })
const timeLeaf = ast.createSchema({ type: 'time', representation: 'date', format: 'time' })
const stringDate = ast.createSchema({ type: 'date', representation: 'string', format: 'date' })
const datetimeString = ast.createSchema({ type: 'datetime' })

const responseOptions = { direction: 'response' as const, refFnName: transformFnName }
const requestOptions = { direction: 'request' as const, refFnName: serializeFnName }

describe('containsDateField', () => {
  it('detects a date/time leaf with representation date', () => {
    expect(containsDateField(dateLeaf)).toBe(true)
    expect(containsDateField(timeLeaf)).toBe(true)
  })

  it('ignores datetime nodes and string-represented dates', () => {
    expect(containsDateField(datetimeString)).toBe(false)
    expect(containsDateField(stringDate)).toBe(false)
    expect(containsDateField(ast.createSchema({ type: 'string' }))).toBe(false)
  })

  it('detects dates nested in objects and arrays', () => {
    const node = ast.createSchema({
      type: 'object',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ast.createProperty({ name: 'createdAt', required: false, schema: dateLeaf }),
      ],
    })
    expect(containsDateField(node)).toBe(true)

    const arrayOfDates = ast.createSchema({ type: 'array', items: [dateLeaf] })
    expect(containsDateField(arrayOfDates)).toBe(true)
  })

  it('terminates on circular refs', () => {
    const selfRef: ast.SchemaNode = ast.createSchema({ type: 'ref', name: 'Node' })
    const objectNode = ast.createSchema({
      type: 'object',
      properties: [ast.createProperty({ name: 'parent', required: false, schema: selfRef })],
    })
    ;(selfRef as { schema?: ast.SchemaNode }).schema = objectNode
    expect(containsDateField(objectNode)).toBe(false)
  })
})

describe('buildTransformerBody - response', () => {
  it('converts object date properties with new Date via toDate', () => {
    const node = ast.createSchema({
      type: 'object',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ast.createProperty({ name: 'createdAt', required: false, schema: dateLeaf }),
      ],
    })
    const body = buildTransformerBody(node, responseOptions)
    expect(body).toContain('const _data = data as any')
    expect(body).toContain('{ ..._data, createdAt: toDate(_data.createdAt) }')
    expect(body).toContain('as T')
  })

  it('maps arrays of dates', () => {
    const node = ast.createSchema({
      type: 'object',
      properties: [ast.createProperty({ name: 'visits', required: false, schema: ast.createSchema({ type: 'array', items: [dateLeaf] }) })],
    })
    const body = buildTransformerBody(node, responseOptions)
    expect(body).toContain('_data.visits?.map((item: any) => toDate(item))')
  })

  it('delegates refs to sibling transformers', () => {
    const ref = ast.createSchema({
      type: 'ref',
      name: 'Category',
      schema: ast.createSchema({ type: 'object', properties: [ast.createProperty({ name: 'createdAt', required: false, schema: dateLeaf })] }),
    })
    const node = ast.createSchema({
      type: 'object',
      properties: [ast.createProperty({ name: 'category', required: false, schema: ref })],
    })
    const body = buildTransformerBody(node, responseOptions)
    expect(body).toContain('category: transformCategory(_data.category)')
    expect(collectDirectDateRefs(node)).toEqual(['Category'])
  })

  it('handles records via additionalProperties', () => {
    const node = ast.createSchema({ type: 'object', properties: [], additionalProperties: dateLeaf })
    const body = buildTransformerBody(node, responseOptions)
    expect(body).toContain('Object.fromEntries(Object.entries(_data).map(([key, value]: [string, any]) => [key, toDate(value)]))')
  })
})

describe('buildTransformerBody - request', () => {
  it('serializes date-time to full ISO, date to YYYY-MM-DD, time to HH:mm:ss', () => {
    const node = ast.createSchema({
      type: 'object',
      properties: [
        ast.createProperty({ name: 'createdAt', required: false, schema: dateLeaf }),
        ast.createProperty({ name: 'birthDate', required: false, schema: dateOnlyLeaf }),
        ast.createProperty({ name: 'openAt', required: false, schema: timeLeaf }),
      ],
    })
    const body = buildTransformerBody(node, requestOptions)
    expect(body).toContain('createdAt: toISO(_data.createdAt)')
    expect(body).toContain('birthDate: toDateISO(_data.birthDate)')
    expect(body).toContain('openAt: toTimeISO(_data.openAt)')
  })
})
