# Kubb v4 ↔ v5 Matrix Validation Report

Generated: 2026-05-21T19:08:11.971Z

## Methodology

Every cell exercises a single plugin × option (with sensible defaults for
everything else). Each cell runs once on v4 (built from `origin/v4` of
`kubb-labs/kubb`) and once on v5 (current local `main` of `kubb-labs/kubb` +
`kubb-labs/plugins`). Generated files are diffed and each file is classified:

- **identical** — bytes match.
- **expected** — diff is explained by a normalisation rule in `expectations.mjs`
  (banner, JSDoc `@example`, `integerType` default change, status-code rename,
  `Data` ↔ `MutationRequest` rename, chained zod `.optional()`, cypress method
  case, etc.). Each rule traces back to the migration guide.
- **v4-only / v5-only** — file exists on one side. v4-only is common for
  `plugin-oas` JSON schema output (removed in v5). v5-only is common for new
  types like `*RequestConfig` / `*Responses`.
- **unexpected** — bytes differ and no rule applies. Surfaces in the
  "Diff highlights" section for manual review.

Cell verdicts:

- **identical** — every file is byte-identical.
- **documented-diff** — every diff is explained by `expectations.mjs`.
- **structural-diff** — builds succeed but output structure differs (multi-
  content-type generation, `*Mutation` aggregate split into `*RequestConfig` +
  `*Responses`, removed `schemas/*.json`, etc.). Not a regression; the
  migration guide documents these.
- **new-in-v5** — option is additive (no v4 equivalent).
- **removed-in-v5** — option was removed; no v5 replacement.
- **build-error** — either side failed to build. Always a problem.
- **empty-v5** — v5 produced no files. Always a problem.

## Summary

| Verdict           | Count |
| ----------------- | ----: |
| identical         |     0 |
| documented-diff   |     0 |
| structural-diff   |    37 |
| new-in-v5         |     1 |
| removed-in-v5     |     2 |
| build-error       |     0 |
| empty-v5          |     0 |

## Cell results

File-count column legend: `identical` / `documented` / `unexpected` / `v4-only` / `v5-only`.

| Plugin | Option | Value | Fixture | Verdict | Files |
| --- | --- | --- | --- | --- | --- |
| pluginTs | output.path | default | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| pluginTs | resolver.resolveTypeName | apiPrefix | petStore.yaml | **structural-diff** | 0 ident / 0 docd / 2 unx / 39 v4o / 29 v5o |
| pluginTs | enumType | literal | enums.yaml | **structural-diff** | 1 ident / 10 docd / 17 unx / 17 v4o / 0 v5o |
| pluginTs | dateType | date | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| pluginTs | integerType | number | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| pluginTs | syntaxType | interface | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| pluginTs | optionalType | qAndUndef | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| pluginTs | UNSTABLE_NAMING | true | petStore.yaml | **removed-in-v5** | 0 ident / 0 docd / 0 unx / 41 v4o / 0 v5o |
| pluginZod | output.path | default | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 52 unx / 10 v4o / 0 v5o |
| pluginZod | version | v3 | petStore.yaml | **removed-in-v5** | 0 ident / 0 docd / 0 unx / 71 v4o / 0 v5o |
| pluginZod | mini | true | petStore.yaml | **new-in-v5** | 0 ident / 0 docd / 0 unx / 0 v4o / 61 v5o |
| pluginFaker | output.path | default | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 52 unx / 10 v4o / 0 v5o |
| pluginClient | output.path | default | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 41 unx / 10 v4o / 1 v5o |
| pluginClient | sdk | className | petStore.yaml | **structural-diff** | 1 ident / 9 docd / 23 unx / 29 v4o / 5 v5o |
| pluginClient | client | fetch | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 41 unx / 10 v4o / 1 v5o |
| pluginReactQuery | output.path | default | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 69 unx / 10 v4o / 1 v5o |
| pluginMsw | output.path | default | petStore.yaml | **structural-diff** | 1 ident / 9 docd / 41 unx / 10 v4o / 0 v5o |
| pluginCypress | output.path | default | petStore.yaml | **structural-diff** | 1 ident / 9 docd / 41 unx / 10 v4o / 0 v5o |
| adapterOas | contentType | json | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| adapterOas | discriminator | inherit | discriminator.yaml | **structural-diff** | 0 ident / 2 docd / 29 unx / 29 v4o / 0 v5o |
| core | output.barrel | all | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| core | output.barrel | disabled | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 20 unx / 11 v4o / 0 v5o |
| pluginTs | enumKeyCasing | screamingSnakeCase | enums.yaml | **structural-diff** | 1 ident / 8 docd / 19 unx / 17 v4o / 0 v5o |
| pluginTs | arrayType | generic | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 22 unx / 10 v4o / 0 v5o |
| pluginZod | typed | true | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 52 unx / 11 v4o / 0 v5o |
| pluginZod | inferred | true | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 52 unx / 10 v4o / 0 v5o |
| pluginZod | coercion | true | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 52 unx / 10 v4o / 0 v5o |
| pluginFaker | dateParser | dayjs | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 52 unx / 10 v4o / 0 v5o |
| pluginFaker | seed | 1234 | petStore.yaml | **structural-diff** | 0 ident / 9 docd / 52 unx / 10 v4o / 0 v5o |
| pluginClient | clientType | class | petStore.yaml | **structural-diff** | 1 ident / 9 docd / 23 unx / 13 v4o / 4 v5o |
| pluginClient | paramsType | object | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 41 unx / 10 v4o / 1 v5o |
| pluginClient | dataReturnType | full | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 41 unx / 10 v4o / 1 v5o |
| pluginReactQuery | suspense | enabled | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 69 unx / 10 v4o / 1 v5o |
| pluginMsw | handlers | true | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 41 unx / 10 v4o / 0 v5o |
| pluginMcp | output.path | default | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 73 unx / 10 v4o / 0 v5o |
| pluginRedoc | output.path | default | petStore.yaml | **structural-diff** | 0 ident / 0 docd / 1 unx / 10 v4o / 0 v5o |
| combination | fullStack | tsZodFakerClient | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 101 unx / 10 v4o / 1 v5o |
| combination | group | byTag | petStore.yaml | **structural-diff** | 1 ident / 9 docd / 81 unx / 10 v4o / 4 v5o |
| combination | clientPlusReactQuery | axios | petStore.yaml | **structural-diff** | 2 ident / 9 docd / 69 unx / 10 v4o / 1 v5o |
| combination | mswPlusFaker | parserFaker | petStore.yaml | **structural-diff** | 1 ident / 9 docd / 71 unx / 10 v4o / 0 v5o |

## Diff highlights — cells with unclassified diffs

These cells succeeded on both sides, but contain at least one file diff that
the normalisation rules in `expectations.mjs` did not explain. Worth a manual
look to confirm each is documented in the migration guide.

- **pluginTs__output_path__default** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **pluginTs__resolver_resolveTypeName__apiPrefix** (2 files): `index.ts`, `types/index.ts`
- **pluginTs__enumType__literal** (17 files): `index.ts`, `types/FindBoroughs.ts`, `types/FindLandUses.ts`, `types/FindTaxLotByBbl.ts`, `types/FindTaxLotGeoJsonByBbl.ts` …+12 more
- **pluginTs__dateType__date** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **pluginTs__integerType__number** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **pluginTs__syntaxType__interface** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **pluginTs__optionalType__qAndUndef** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **pluginZod__output_path__default** (52 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+47 more
- **pluginFaker__output_path__default** (52 files): `index.ts`, `mocks/createAddPet.ts`, `mocks/createAddPetRequest.ts`, `mocks/createAddress.ts`, `mocks/createApiResponse.ts` …+47 more
- **pluginClient__output_path__default** (41 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+36 more
- **pluginClient__sdk__className** (23 files): `clients/index.ts`, `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts` …+18 more
- **pluginClient__client__fetch** (41 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+36 more
- **pluginReactQuery__output_path__default** (69 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+64 more
- **pluginMsw__output_path__default** (41 files): `index.ts`, `msw/addPetHandler.ts`, `msw/createUserHandler.ts`, `msw/createUsersWithListInputHandler.ts`, `msw/deleteOrderHandler.ts` …+36 more
- **pluginCypress__output_path__default** (41 files): `cypress/addPet.ts`, `cypress/createUser.ts`, `cypress/createUsersWithListInput.ts`, `cypress/deleteOrder.ts`, `cypress/deletePet.ts` …+36 more
- **adapterOas__contentType__json** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **adapterOas__discriminator__inherit** (29 files): `index.ts`, `types/ACHDetailsResponse.ts`, `types/Advanced.ts`, `types/Car.ts`, `types/Cat.ts` …+24 more
- **core__output_barrel__all** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **core__output_barrel__disabled** (20 files): `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts`, `types/DeletePet.ts` …+15 more
- **pluginTs__enumKeyCasing__screamingSnakeCase** (19 files): `index.ts`, `types/FindBoroughs.ts`, `types/FindLandUses.ts`, `types/FindTaxLotByBbl.ts`, `types/FindTaxLotGeoJsonByBbl.ts` …+14 more
- **pluginTs__arrayType__generic** (22 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+17 more
- **pluginZod__typed__true** (52 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+47 more
- **pluginZod__inferred__true** (52 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+47 more
- **pluginZod__coercion__true** (52 files): `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts`, `types/DeleteOrder.ts` …+47 more
- **pluginFaker__dateParser__dayjs** (52 files): `index.ts`, `mocks/createAddPet.ts`, `mocks/createAddPetRequest.ts`, `mocks/createAddress.ts`, `mocks/createApiResponse.ts` …+47 more
- **pluginFaker__seed__1234** (52 files): `index.ts`, `mocks/createAddPet.ts`, `mocks/createAddPetRequest.ts`, `mocks/createAddress.ts`, `mocks/createApiResponse.ts` …+47 more
- **pluginClient__clientType__class** (23 files): `clients/index.ts`, `index.ts`, `types/AddPet.ts`, `types/CreateUser.ts`, `types/CreateUsersWithListInput.ts` …+18 more
- **pluginClient__paramsType__object** (41 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+36 more
- **pluginClient__dataReturnType__full** (41 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+36 more
- **pluginReactQuery__suspense__enabled** (69 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+64 more
- **pluginMsw__handlers__true** (41 files): `index.ts`, `msw/addPetHandler.ts`, `msw/createUserHandler.ts`, `msw/createUsersWithListInputHandler.ts`, `msw/deleteOrderHandler.ts` …+36 more
- **pluginMcp__output_path__default** (73 files): `index.ts`, `mcp/.mcp.json`, `mcp/addPet.ts`, `mcp/createUser.ts`, `mcp/createUsersWithListInput.ts` …+68 more
- **pluginRedoc__output_path__default** (1 files): `docs.html`
- **combination__fullStack__tsZodFakerClient** (101 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+96 more
- **combination__group__byTag** (81 files): `clients/index.ts`, `clients/petController/addPet.ts`, `clients/petController/deletePet.ts`, `clients/petController/findPetsByStatus.ts`, `clients/petController/findPetsByTags.ts` …+76 more
- **combination__clientPlusReactQuery__axios** (69 files): `clients/addPet.ts`, `clients/createUser.ts`, `clients/createUsersWithListInput.ts`, `clients/deleteOrder.ts`, `clients/deletePet.ts` …+64 more
- **combination__mswPlusFaker__parserFaker** (71 files): `index.ts`, `mocks/createAddPet.ts`, `mocks/createAddPetRequest.ts`, `mocks/createAddress.ts`, `mocks/createApiResponse.ts` …+66 more
