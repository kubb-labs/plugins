import { describe, expect, it } from 'vitest'
import { createGroupConfig } from './group.ts'

describe('createGroupConfig', () => {
  it('names path groups by the second path segment', () => {
    const config = createGroupConfig({ type: 'path' })
    const name = config?.name as (ctx: { group: string }) => string

    expect(name({ group: '/pet/findByStatus' })).toBe('pet')
  })

  it('leaves tag groups unnamed, so Kubb nests a tag in the folders of its parent tags', () => {
    expect(createGroupConfig({ type: 'tag' })).toStrictEqual({ type: 'tag' })
  })

  it('keeps a custom name', () => {
    const name = () => 'custom'

    expect(createGroupConfig({ type: 'tag', name })?.name).toBe(name)
  })
})
