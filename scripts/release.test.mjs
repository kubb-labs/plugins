import { describe, expect, it } from 'vitest'
import { parseStaged } from './release.mjs'

describe('parseStaged', () => {
  it('returns name/version pairs from a JSON array payload', () => {
    const output = JSON.stringify([
      { name: '@kubb/plugin-axios', version: '5.0.0-beta.99' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.99' },
    ])

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/plugin-axios', version: '5.0.0-beta.99' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.99' },
    ])
  })

  it('drops JSON entries missing a name or version', () => {
    const output = JSON.stringify([{ name: '@kubb/plugin-axios', version: '5.0.0-beta.99' }, { name: '@kubb/plugin-ts' }, { version: '1.0.0' }])

    expect(parseStaged(output)).toStrictEqual([{ name: '@kubb/plugin-axios', version: '5.0.0-beta.99' }])
  })

  it('returns name/version pairs from a JSON object keyed by package name', () => {
    const output = JSON.stringify({
      '@kubb/plugin-axios': { name: '@kubb/plugin-axios', version: '5.0.0-beta.99' },
      '@kubb/plugin-ts': { name: '@kubb/plugin-ts', version: '5.0.0-beta.99' },
    })

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/plugin-axios', version: '5.0.0-beta.99' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.99' },
    ])
  })

  it('falls back to the object key as the name when an entry has neither a name nor a packageName field', () => {
    const output = JSON.stringify({ '@kubb/plugin-axios': { version: '5.0.0-beta.99' } })

    expect(parseStaged(output)).toStrictEqual([{ name: '@kubb/plugin-axios', version: '5.0.0-beta.99' }])
  })

  it('falls back to scanning `+ <name>@<version>` lines when the payload is not JSON', () => {
    const output = ['Packages: +2', '+ @kubb/plugin-axios@5.0.0-beta.99', '+ @kubb/plugin-ts@5.0.0-beta.99', 'Done'].join('\n')

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/plugin-axios', version: '5.0.0-beta.99' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.99' },
    ])
  })

  it('returns an empty array when nothing was staged', () => {
    expect(parseStaged('No packages to publish')).toStrictEqual([])
  })
})
