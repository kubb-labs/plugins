<div align="center">
  <h1>@kubb/plugin-react-query</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://codesandbox.io/s/github/kubb-labs/plugins/tree/main/examples/react-query" target="_blank">View Demo</a>
<span> · </span>
<a href="https://kubb.dev/plugins/react-query" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

`@kubb/plugin-react-query` generates TanStack Query hooks from your OpenAPI specification. Each operation becomes a typed `useQuery`, `useMutation`, or `useInfiniteQuery` hook.

## Features

- Generates `useQuery`, `useMutation`, `useInfiniteQuery`, and `queryOptions` hooks
- Infers request, response, and error types from the spec
- Groups output files by tag, operation, or a custom strategy
- Works with `@kubb/plugin-ts`, `@kubb/plugin-zod`, and `@kubb/plugin-client`

## Installation

```bash
bun add @kubb/plugin-react-query
# or
pnpm add @kubb/plugin-react-query
# or
npm install @kubb/plugin-react-query
```

## Documentation

See the [full documentation](https://kubb.dev/plugins/react-query) for configuration options and examples.

## `pathParamsAsGetters`

Opt-in option that widens the path parameter signature of generated `useQuery` hooks so callers can pass either the value or a zero-arg getter:

```ts
pluginReactQuery({
  pathParamsAsGetters: true, // default: false
})
```

When the option is enabled, a hook for `GET /pet/{petId}` is generated as:

```ts
// Signature accepts both forms
useGetPetById(petId) // plain value
useGetPetById(() => petId) // getter

// Generated body unwraps the getter exactly once, then forwards the
// plain value to the queryKey and queryOptions helpers:
const petId_ = typeof petId === 'function' ? petId() : petId
const queryKey = getPetByIdQueryKey(petId_)
useQuery({ ...getPetByIdQueryOptions(petId_, config), ...resolvedOptions, queryKey })
```

The default is `false` and the generated output is byte-identical to previous releases when the option is omitted. The runtime cost when enabled is a single `typeof` check per hook call.

### When to use it

Reactive frameworks where reading a value at hook-call time captures only the initial snapshot can warn on, or silently break, kubb-generated hooks. The getter form keeps the read inside a closure that re-evaluates on each access:

- **Svelte 5** — `$state` / `$derived` references emit a `state_referenced_locally` compiler warning when handed to a hook that reads them only at init.
- **Solid** — signals (`createSignal`) must be invoked at read time; passing the value flattens the reactivity.
- **MobX**, **Preact signals**, and similar observable systems — same closure-capture story.

The option only affects the path-parameter slot. Query params, headers, and the request body retain their existing types and call-site shape.

### Scope

The current implementation covers the `useQuery` hook produced by `queryGenerator`. The infinite, suspense, and mutation variants are not affected by the option in this release — their generated signatures continue to take path params by value.

## Supporting Kubb

Kubb is an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/plugin-react-query?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/plugin-react-query
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/plugin-react-query?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/plugin-react-query
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-labs/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/@kubb/plugin-react-query
[minified-src]: https://img.shields.io/bundlephobia/min/@kubb/plugin-react-query?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/@kubb/plugin-react-query
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/plugin-react-query
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
