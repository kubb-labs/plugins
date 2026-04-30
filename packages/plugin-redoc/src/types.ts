import type { Exclude, Include, Output, Override, PluginFactoryOptions } from '@kubb/core'

export type Options = {
  output?: {
    /**
     * Output path for the generated HTML documentation.
     *
     * @default 'docs.html'
     */
    path: string
  }
}

type ResolveOptions = {
  output: Output<never>
  name: string
  exclude: Array<Exclude>
  include?: Array<Include>
  override: Array<Override<ResolveOptions>>
}

export type PluginRedoc = PluginFactoryOptions<'plugin-redoc', Options, ResolveOptions>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-redoc': PluginRedoc
    }
  }
}
