import type { AdapterOas } from '@kubb/adapter-oas'
import { describe, expect, test } from 'vitest'
import { getPageHTML } from './redoc.ts'

const payload = '</script><script>alert(1)</script>'

function createDocument(): AdapterOas['document'] {
  return {
    openapi: '3.0.3',
    info: { title: 'Pet store', version: '1.0.0', description: payload },
    paths: {
      '/pets': {
        get: {
          description: 'Line\u2028separator & <b>bold</b>',
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  } as AdapterOas['document']
}

function getInlineData(html: string) {
  const match = html.match(/const data = ([\s\S]*?);\n\s*Redoc\.init/)
  if (!match?.[1]) throw new Error('Inline Redoc data not found')
  return match[1]
}

describe('getPageHTML', () => {
  test('keeps a spec string with `</script>` inside the inline data', () => {
    const document = createDocument()
    const html = getPageHTML(document)

    expect(html).not.toContain(payload)
    expect(html.match(/<script\b/g)).toHaveLength(2)
    expect(html.match(/<\/script>/g)).toHaveLength(2)

    const data = getInlineData(html)
    expect(data).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(data)).toEqual(document)
  })

  test('loads a pinned Redoc bundle with an integrity hash', () => {
    const html = getPageHTML(createDocument())

    expect(html).not.toContain('/latest/')
    expect(html).toMatch(
      /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/redoc@\d+\.\d+\.\d+\/bundles\/redoc\.standalone\.js" integrity="sha384-[A-Za-z0-9+/=]+" crossorigin="anonymous"><\/script>/,
    )
  })
})
