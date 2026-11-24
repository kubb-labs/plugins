import { defineConfig } from 'tsdown'
import { pluginBuilds } from '../../configs/tsdown.ts'

export default defineConfig(pluginBuilds({ deps: { neverBundle: [/^@kubb\//, '@types/react'], alwaysBundle: [/@internals/] } }))
