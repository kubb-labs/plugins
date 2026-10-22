import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { transform } from './transform.ts'

const fileName = path.resolve(import.meta.dirname, '../../../schemas/3.0.x/petStore.yaml')

describe('transform', () => {
  test('returns the plugin-ts types of a spec as one module', async () => {
    const result = await transform({ fileName, content: await readFile(fileName, 'utf8') })

    expect(result.diagnostics).toBeUndefined()
    expect(result.text).toContain('export type Pet = {')
    expect(result.text).not.toMatch(/^import /m)
  })

  test('prints arrays as `Array<T>` with `arrayType: generic`', async () => {
    const content = await readFile(fileName, 'utf8')

    expect((await transform({ fileName, content })).text).toContain('photoUrls: string[]')
    expect((await transform({ fileName, content }, { arrayType: 'generic' })).text).toContain('photoUrls: Array<string>')
  })

  test('returns an empty module and a diagnostic for an invalid spec', async () => {
    const result = await transform({ fileName, content: 'openapi: 3.0.0\ninfo: [oops\n' })

    expect(result.text).toBe('export {}')
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics?.[0]?.messageText).toContain('JSON or YAML')
  })

  test('places a spec error on the key it points at', async () => {
    const content = [
      'openapi: 3.0.0',
      'info: { title: Pets, version: "1" }',
      'paths: {}',
      'components:',
      '  schemas:',
      '    Pet:',
      '      properties:',
      "        owner: { $ref: '#/components/schemas/Missing' }",
      '',
    ].join('\n')
    const [diagnostic] = (await transform({ fileName, content })).diagnostics ?? []

    expect(content.slice(diagnostic!.start, diagnostic!.start + diagnostic!.length)).toBe("'#/components/schemas/Missing'")
  })
})

describe('transform mappings', async () => {
  const content = await readFile(fileName, 'utf8')
  const result = await transform({ fileName, content })

  /** Each generated name with the spec text and line it maps to. */
  const mapped = (result.mappings ?? []).map(([virtualStart, virtualLength, originalStart, originalLength]) => ({
    name: result.text.slice(virtualStart, virtualStart + virtualLength),
    key: content.slice(originalStart, originalStart + originalLength),
    line: content.slice(0, originalStart).split('\n').length,
  }))
  const lineOf = (pattern: RegExp) => content.split('\n').findIndex((line) => pattern.test(line)) + 1

  test('maps a component schema to its key under components.schemas', () => {
    expect(mapped).toContainEqual({ name: 'Pet', key: 'Pet', line: lineOf(/^ {4}Pet:/) })
  })

  test('maps schema properties to their keys under properties', () => {
    const petLine = lineOf(/^ {4}Pet:/)
    const name = mapped.find((entry) => entry.name === 'name' && entry.line > petLine)

    expect(name).toMatchObject({ key: 'name' })
    expect(mapped.filter((entry) => entry.name === 'photoUrls').map((entry) => entry.key)).toContain('photoUrls')
  })

  test('maps an extracted enum and its key type to the property it came from', () => {
    const status = mapped.find((entry) => entry.name === 'OrderStatusEnumKey')

    expect(status).toMatchObject({ key: 'status' })
    expect(mapped.find((entry) => entry.name === 'orderStatusEnum')).toStrictEqual(status && { ...status, name: 'orderStatusEnum' })
  })

  test('maps operation types to the operation, its parameters and its responses', () => {
    const getLine = lineOf(/^ {2}\/pet\/\{petId\}:/) + 1

    expect(mapped).toContainEqual({ name: 'GetPetByIdResponse', key: 'get', line: getLine })
    expect(mapped.find((entry) => entry.name === 'GetPetByIdPath')).toMatchObject({ key: 'parameters' })
    expect(mapped.find((entry) => entry.name === 'GetPetByIdStatus404')).toMatchObject({ key: "'404'" })
    expect(mapped.find((entry) => entry.name === 'AddPetBody')).toMatchObject({ key: 'requestBody' })
  })

  test('keeps segments ordered by virtual start', () => {
    const starts = (result.mappings ?? []).map(([virtualStart]) => virtualStart)

    expect(starts).toStrictEqual([...starts].sort((a, b) => a - b))
  })
})
