import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildCallConfig } from './callConfig.ts'

describe('buildCallConfig', () => {
  function build(contents: Array<{ contentType: string; schema: ast.SchemaNode }>): string {
    const node = ast.factory.createOperation({
      operationId: 'speech',
      method: 'POST',
      path: '/speech',
      responses: [ast.factory.createResponse({ statusCode: '200', content: contents.map((content) => ast.factory.createContent(content)) })],
    })
    return buildCallConfig({ node, validatorHooks: null, throwOnErrorDefault: true, returnType: 'full' }).callConfig
  }

  test('bakes one responseType as a string, and a map when the content types need different parsers', () => {
    const blob = ast.factory.createSchema({ type: 'blob' })
    const json = ast.factory.createSchema({ type: 'object' })

    expect(build([{ contentType: 'audio/mpeg', schema: blob }])).toContain("responseType: 'blob'")
    expect(
      build([
        { contentType: 'audio/mpeg', schema: blob },
        { contentType: 'text/event-stream', schema: json },
      ]),
    ).toContain("responseType: { 'audio/mpeg': 'blob', 'text/event-stream': 'stream' }")
    expect(build([{ contentType: 'application/json', schema: json }])).not.toContain('responseType')
  })
})
