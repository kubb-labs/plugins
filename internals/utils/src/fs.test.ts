import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { getRelativePath } from './fs.ts'

describe('getRelativePath', () => {
  const relTestDir = path.join(os.tmpdir(), 'kubb-test-rel')
  const folderPath = path.join(relTestDir, 'folder')

  beforeAll(async () => {
    await mkdir(relTestDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(relTestDir, { recursive: true, force: true })
  })

  test('returns correct relative path (POSIX)', async () => {
    expect(getRelativePath(relTestDir, path.join(folderPath, 'test.js'))).toBe('./folder/test.js')
    expect(getRelativePath(folderPath, relTestDir)).toBe('./..')
  })

  test('returns correct relative path for Windows-style paths', () => {
    const winMocks = 'C:\\Users\\user\\project\\mocks'
    const winFolder = 'C:\\Users\\user\\project\\mocks\\folder'
    const winFile = 'C:\\Users\\user\\project\\mocks\\folder\\test.js'

    expect(getRelativePath(winMocks, winFile)).toBe('./folder/test.js')
    expect(getRelativePath(winFolder, winMocks)).toBe('./..')
    expect(getRelativePath(winMocks, winFolder)).toBe('./folder')
    expect(getRelativePath('C:/Users/user/project/mocks', 'C:\\Users\\user\\project\\mocks\\folder\\test.js')).toBe('./folder/test.js')
  })

  test('throws when arguments are missing', () => {
    expect(() => getRelativePath(null, null)).toThrow()
  })
})
