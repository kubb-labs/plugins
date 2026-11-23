import { describe, expect, test } from 'vitest'
import { getRelativePath } from './fs.ts'

describe('getRelativePath', () => {
  test('returns correct relative path for Windows-style paths', () => {
    const winMocks = 'C:\\Users\\user\\project\\mocks'
    const winFolder = 'C:\\Users\\user\\project\\mocks\\folder'
    const winFile = 'C:\\Users\\user\\project\\mocks\\folder\\test.js'

    expect(getRelativePath(winMocks, winFile)).toBe('./folder/test.js')
    expect(getRelativePath(winFolder, winMocks)).toBe('./..')
    expect(getRelativePath(winMocks, winFolder)).toBe('./folder')
    expect(getRelativePath('C:/Users/user/project/mocks', 'C:\\Users\\user\\project\\mocks\\folder\\test.js')).toBe('./folder/test.js')
  })
})
