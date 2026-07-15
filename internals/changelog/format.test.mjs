import { describe, expect, it } from 'vitest'
import { packageHeadingPattern, versionHeadingPattern } from './format.mjs'

describe('versionHeadingPattern', () => {
  it('matches the exact version heading', () => {
    expect(versionHeadingPattern('5.0.0-beta.99').test('## 5.0.0-beta.99')).toBe(true)
  })

  it('does not match a longer version sharing the same numeric prefix', () => {
    expect(versionHeadingPattern('5.0.0').test('## v5.0.0-rc.1')).toBe(false)
  })

  it('matches a bare version with no prerelease suffix', () => {
    expect(versionHeadingPattern('5.0.0').test('## 5.0.0')).toBe(true)
  })
})

describe('packageHeadingPattern', () => {
  it('matches an exact package heading', () => {
    expect(packageHeadingPattern('@kubb/plugin-axios').test('### @kubb/plugin-axios')).toBe(true)
  })

  it('does not match a different package heading with a shared prefix', () => {
    expect(packageHeadingPattern('@kubb/plugin-ts').test('### @kubb/plugin-ts-extra')).toBe(false)
  })
})
