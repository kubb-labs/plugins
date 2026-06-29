import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

// Strict-typechecks a spec's generated models + zod output. Invoked from the `hooks.done` of
// `kubb.config.js` as `node ./typecheckGen.mjs <name>`, so a generated type that does not compile
// fails the generation run. Kubb spawns hooks without a shell, so the find/glob logic lives here
// (not inline shell), and a per-spec tsconfig with `-p` avoids passing thousands of files as args.

const name = process.argv[2]
if (!name) {
  console.error('typecheckGen: missing spec name')
  process.exit(2)
}

// Specs whose generated output cannot strict-compile for reasons outside the generator. Skipping
// keeps the gate honest: it asserts "every generated spec compiles" without pretending these two do.
//   - square: the input OpenAPI is malformed — it $refs `AppFeeAllocation`/`CurrencyExchange`
//     without defining them as components, so the output has dangling imports (TS2307).
//   - stripe: `z.infer` over its enormous composed schema graph exceeds TypeScript's instantiation
//     depth ceiling (TS2589). The schema is valid and runs; only static inference hits the limit.
const skip = new Set(['square', 'stripe'])
if (skip.has(name)) {
  process.exit(0)
}

const base = `./gen/${name}`
const dirs = ['models/ts', 'zod'].filter((dir) => existsSync(`${base}/${dir}`))

// A spec with no component schemas generates no models/zod, so there is nothing to typecheck.
if (dirs.length === 0) {
  process.exit(0)
}

const configPath = `${base}/.tsconfig.typecheck.json`
writeFileSync(
  configPath,
  JSON.stringify({
    compilerOptions: {
      strict: true,
      noEmit: true,
      moduleResolution: 'Bundler',
      module: 'ESNext',
      target: 'ES2021',
      allowImportingTsExtensions: true,
      skipLibCheck: true,
      jsx: 'react-jsx',
    },
    include: dirs.map((dir) => `./${dir}/**/*.ts`),
  }),
)

const require = createRequire(import.meta.url)
const tsc = require.resolve('typescript/bin/tsc')

try {
  execFileSync(process.execPath, [tsc, '-p', configPath], { stdio: 'inherit' })
} catch {
  rmSync(configPath, { force: true })
  process.exit(1)
}
rmSync(configPath, { force: true })
