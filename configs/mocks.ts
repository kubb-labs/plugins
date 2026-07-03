import type { ast } from 'kubb/kit'
import { createMockedPluginDriver, matchFiles as matchFilesBase } from 'kubb/kit/testing'
import { parserTs } from '@kubb/parser-ts'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
import { expect } from 'vitest'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

export async function format(source?: string): Promise<string> {
  if (!source) return ''
  try {
    return prettierFormat(source, formatOptions)
  } catch {
    return source
  }
}

export const mockedPluginDriver = createMockedPluginDriver()

const parsers = new Map<`.${string}`, any>([['.ts', parserTs]])

/**
 * Renders the driver's `.ts` files to their raw, unformatted source. Snapshots run through
 * prettier (see {@link format}), which silently repairs whitespace, so guarding the generator's
 * own output means inspecting this raw text instead.
 */
export function rawSources(files: Array<ast.FileNode> | undefined): Array<string> {
  return (files ?? []).filter((file) => file.baseName.endsWith('.ts')).map((file) => parserTs.parse(file))
}

/**
 * Guards the raw (pre-prettier) output every generator emits. Prettier repairs whitespace before
 * snapshotting, so without this check a generator could regress to double blank lines or a blank
 * line straight after an opening bracket and no snapshot would notice.
 */
function assertCleanRawOutput(files: Array<ast.FileNode> | undefined): void {
  for (const source of rawSources(files)) {
    expect(source, 'raw output has no double blank lines').not.toMatch(/\n[ \t]*\n[ \t]*\n/)
    expect(source, 'raw output has no blank line right after an opening bracket').not.toMatch(/[([{][ \t]*\n[ \t]*\n/)
  }
}

export function matchFiles(files: Array<ast.FileNode> | undefined, pre?: string) {
  assertCleanRawOutput(files)
  return matchFilesBase(files, { parsers, format, pre })
}
