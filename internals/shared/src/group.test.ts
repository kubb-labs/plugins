import { describe, expect, it } from 'vitest'
import { createGroupConfig } from './group.ts'

describe('createGroupConfig', () => {
  it('returns null when grouping is disabled', () => {
    expect(createGroupConfig(undefined)).toBeNull()
  })

  it('names path groups by the second path segment', () => {
    const config = createGroupConfig({ type: 'path' })
    const name = config?.name as (ctx: { group: string }) => string

    expect(name({ group: '/pet/findByStatus' })).toBe('pet')
  })

  it('names tag groups with the plain camelCased group', () => {
    const config = createGroupConfig({ type: 'tag' })
    const name = config?.name as (ctx: { group: string }) => string

    expect(name({ group: 'pet store' })).toBe('petStore')
  })

  it('honors a user-provided name over the default namer', () => {
    const custom = (): string => 'Custom'

    const honored = createGroupConfig({ type: 'tag', name: custom })
    expect(honored?.name).toBe(custom)
  })
})
