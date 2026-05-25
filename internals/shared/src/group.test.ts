import { describe, expect, it } from 'vitest'
import { createGroupConfig } from './group.ts'

describe('createGroupConfig', () => {
  it('returns null when grouping is disabled', () => {
    expect(createGroupConfig(undefined, { suffix: 'Controller' })).toBeNull()
  })

  it('names path groups by the second path segment', () => {
    const config = createGroupConfig({ type: 'path' }, { suffix: 'Controller' })
    const name = config?.name as (ctx: { group: string }) => string

    expect(name({ group: '/pet/findByStatus' })).toBe('pet')
  })

  it('names tag groups with the camelCased group plus suffix', () => {
    const controller = createGroupConfig({ type: 'tag' }, { suffix: 'Controller' })
    const requests = createGroupConfig({ type: 'tag' }, { suffix: 'Requests' })
    const controllerName = controller?.name as (ctx: { group: string }) => string
    const requestsName = requests?.name as (ctx: { group: string }) => string

    expect(controllerName({ group: 'pet store' })).toBe('petStoreController')
    expect(requestsName({ group: 'pet store' })).toBe('petStoreRequests')
  })

  it('ignores a user-provided name unless honorName is set', () => {
    const custom = (): string => 'Custom'

    const ignored = createGroupConfig({ type: 'tag', name: custom }, { suffix: 'Controller' })
    expect(ignored?.name).not.toBe(custom)

    const honored = createGroupConfig({ type: 'tag', name: custom }, { suffix: 'Controller', honorName: true })
    expect(honored?.name).toBe(custom)
  })
})
