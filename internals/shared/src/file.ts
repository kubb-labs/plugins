import type { ast, GeneratorContext, Group, Output, Resolver } from '@kubb/kit'

type FileLocationContext = Pick<GeneratorContext, 'root'> & {
  options: { output: Output; group?: Group | null }
}

type FileContext = Pick<GeneratorContext, 'config' | 'meta'> & {
  resolver: Pick<Resolver, 'default'>
  options: { output: Output }
}

/** The `root`, `output` and `group` of the current plugin, for `resolver.file` and `resolver.imports`. */
export function getFileLocation(ctx: FileLocationContext): { root: string; output: Output; group: Group | undefined } {
  return { root: ctx.root, output: ctx.options.output, group: ctx.options.group ?? undefined }
}

/** The props of the `<File>` a generator renders for `file`, with the banner and footer the plugin's `output` sets. */
export function getFile<TFile extends Pick<ast.FileNode, 'baseName' | 'path' | 'meta'>>(
  ctx: FileContext,
  file: TFile,
): Pick<TFile, 'baseName' | 'path' | 'meta'> & { banner: string | null; footer: string | null } {
  const { config, meta, resolver } = ctx
  const { output } = ctx.options
  const bannerFile = { path: file.path, baseName: file.baseName }

  return {
    baseName: file.baseName,
    path: file.path,
    meta: file.meta,
    banner: resolver.default.banner(meta, { output, config, file: bannerFile }),
    footer: resolver.default.footer(meta, { output, config, file: bannerFile }),
  }
}
