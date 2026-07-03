import { describe, expect, it } from 'vitest'
import { extractVersionNotes } from './createReleases.mjs'

// Matches the real shape @changesets/changelog-github writes to a package's
// own CHANGELOG.md: no "v" prefix, no package-name subheading (the whole
// file already belongs to one package).
const changelog = `# @kubb/plugin-zod

## 5.0.0-beta.82

### Minor Changes

- [#600](https://github.com/kubb-labs/plugins/pull/600) Add support for the \`readonly\` keyword on object properties.

## 5.0.0-beta.81

### Patch Changes

- Fix optional field detection for nested discriminated unions.
`

describe('extractVersionNotes', () => {
  it('extracts the version block for the given version', () => {
    expect(extractVersionNotes({ changelog, version: '5.0.0-beta.82' })).toBe(
      '### Minor Changes\n\n- [#600](https://github.com/kubb-labs/plugins/pull/600) Add support for the `readonly` keyword on object properties.',
    )
  })

  it('does not reach into an older version block', () => {
    const notes = extractVersionNotes({ changelog, version: '5.0.0-beta.81' })
    expect(notes).toContain('Patch Changes')
    expect(notes).not.toContain('readonly')
  })

  it('returns null when the version heading does not exist', () => {
    expect(extractVersionNotes({ changelog, version: '9.9.9' })).toBeNull()
  })

  it('does not match a longer prerelease version sharing the same numeric prefix', () => {
    expect(extractVersionNotes({ changelog, version: '5.0.0' })).toBeNull()
  })
})
