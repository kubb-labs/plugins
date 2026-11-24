import { kubbContext } from '@kubb/kit'
import { createMockedSetupContext } from '#mocks'
import { expect, test } from 'vitest'
import { pluginRedoc } from './plugin.ts'
import type { PluginRedoc } from './types.ts'

test('fails with KUBB_ADAPTER_REQUIRED when the config has no adapter that reads OpenAPI', async () => {
  const plugin = pluginRedoc()
  const ctx = createMockedSetupContext<PluginRedoc>()

  await expect(kubbContext.run(ctx, async () => plugin.setup?.(plugin.options ?? {}, ctx))).rejects.toMatchObject({
    diagnostic: { code: 'KUBB_ADAPTER_REQUIRED', message: 'Plugin "plugin-redoc" needs an OpenAPI document, but the config has no adapter.' },
  })
})
