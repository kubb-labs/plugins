import { describe, expect, it } from 'vitest'
import { extractVersionNotes } from './createReleases.mjs'

const changelog = `# @kubb/plugin-axios

## 5.0.0-beta.99

### Minor Changes

- Keep the OpenAPI document's exact parameter names for path, query, and header parameters.

### Patch Changes

- Updated dependencies:
  - @kubb/plugin-ts@5.0.0-beta.99

## 5.0.0-beta.98

### Patch Changes

- Updated dependencies:
  - @kubb/plugin-ts@5.0.0-beta.98
`

describe('extractVersionNotes', () => {
  it('returns the whole version block for that version', () => {
    const notes = extractVersionNotes({ changelog, version: '5.0.0-beta.99' })

    expect(notes).toContain('### Minor Changes')
    expect(notes).toContain('### Patch Changes')
    expect(notes).not.toContain('5.0.0-beta.98')
  })

  it('finds an older version block by its own version', () => {
    expect(extractVersionNotes({ changelog, version: '5.0.0-beta.98' })).toBe('### Patch Changes\n\n- Updated dependencies:\n  - @kubb/plugin-ts@5.0.0-beta.98')
  })

  it('returns null when the version heading does not exist', () => {
    expect(extractVersionNotes({ changelog, version: '9.9.9' })).toBeNull()
  })

  it('does not match a longer prerelease version sharing the same numeric prefix', () => {
    const withPrerelease = `# @kubb/plugin-axios\n\n## 5.0.0-rc.1\n\n### Minor Changes\n\n- Something.\n`
    expect(extractVersionNotes({ changelog: withPrerelease, version: '5.0.0' })).toBeNull()
  })
})
