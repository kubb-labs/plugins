import { fileURLToPath } from 'node:url'

/**
 * Request runtime copied once into the generated `.kubb/playwright.ts`.
 */
export const playwrightTemplatePath = fileURLToPath(new URL('../templates/playwright.ts', import.meta.url))
