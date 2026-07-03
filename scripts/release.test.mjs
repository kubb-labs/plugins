import { describe, expect, it } from 'vitest'
import { parseStaged } from './release.mjs'

describe('parseStaged', () => {
  it('returns name/version pairs from a JSON array payload', () => {
    const output = JSON.stringify([
      { name: '@kubb/plugin-zod', version: '5.0.0-beta.82' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.82' },
    ])

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/plugin-zod', version: '5.0.0-beta.82' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.82' },
    ])
  })

  it('drops JSON entries missing a name or version', () => {
    const output = JSON.stringify([{ name: '@kubb/plugin-zod', version: '5.0.0-beta.82' }, { name: '@kubb/plugin-ts' }, { version: '1.0.0' }])

    expect(parseStaged(output)).toStrictEqual([{ name: '@kubb/plugin-zod', version: '5.0.0-beta.82' }])
  })

  it('returns name/version pairs from a JSON object keyed by package name', () => {
    const output = JSON.stringify({
      '@kubb/plugin-zod': { name: '@kubb/plugin-zod', version: '5.0.0-beta.82' },
      '@kubb/plugin-ts': { name: '@kubb/plugin-ts', version: '5.0.0-beta.82' },
    })

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/plugin-zod', version: '5.0.0-beta.82' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.82' },
    ])
  })

  it('falls back to the object key as the name when an entry has neither a name nor a packageName field', () => {
    const output = JSON.stringify({ '@kubb/plugin-zod': { version: '5.0.0-beta.82' } })

    expect(parseStaged(output)).toStrictEqual([{ name: '@kubb/plugin-zod', version: '5.0.0-beta.82' }])
  })

  it('falls back to scanning `+ <name>@<version>` lines when the payload is not JSON', () => {
    const output = ['Packages: +2', '+ @kubb/plugin-zod@5.0.0-beta.82', '+ @kubb/plugin-ts@5.0.0-beta.82', 'Done'].join('\n')

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/plugin-zod', version: '5.0.0-beta.82' },
      { name: '@kubb/plugin-ts', version: '5.0.0-beta.82' },
    ])
  })

  it('returns an empty array when nothing was staged', () => {
    expect(parseStaged('No packages to publish')).toStrictEqual([])
  })
})
