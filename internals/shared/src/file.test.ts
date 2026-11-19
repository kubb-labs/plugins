import { createResolver, type Config, type GeneratorContext } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { getFile, getFileLocation } from './file.ts'

const resolver = createResolver({ pluginName: 'plugin-test' })
const config = { root: '/project', output: { path: './gen' } } as Config
const meta: GeneratorContext['meta'] = { title: 'Pet Store', version: '1.0.0' }
const output = { path: 'types', mode: 'directory' as const, banner: '// banner', footer: '// footer' }
const root = '/project/gen'

describe('getFileLocation', () => {
  test('reads root, output and group from the context', () => {
    const group = { type: 'tag' as const }

    expect(getFileLocation({ root, options: { output, group } })).toEqual({ root, output, group })
    expect(getFileLocation({ root, options: { output, group: null } })).toEqual({ root, output, group: undefined })
  })
})

describe('getFile', () => {
  test('returns the props of a hand-written file shell', () => {
    const file = resolver.file({ name: 'pet', extname: '.ts', root, output })
    const bannerContext = { output, config, file: { path: file.path, baseName: file.baseName } }

    expect(getFile({ config, meta, resolver, options: { output } }, file)).toEqual({
      baseName: file.baseName,
      path: file.path,
      meta: file.meta,
      banner: resolver.default.banner(meta, bannerContext),
      footer: resolver.default.footer(meta, bannerContext),
    })
    expect(resolver.default.banner(meta, bannerContext)).toContain('// banner')
  })
})
