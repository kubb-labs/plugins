# @kubb/plugin-barrel

## 5.0.0-alpha.53

### Minor Changes

- Initial release of `@kubb/plugin-barrel`.

  Generates barrel (`index.ts`) files at the root and per-plugin output level so every plugin's generated code is importable through a single entry point.

  **Features**

  - Per-plugin barrel generation based on each plugin's `output.barrelType` setting.
  - Root barrel generation with `root.barrelType` option.
  - Runs as a `post`-enforced plugin so all other plugins finish writing files before barrels are created.
  - Supports `'all'` (wildcard re-exports), `'named'` (explicit named exports), and `'propagate'` (skip barrel, propagate upward).
