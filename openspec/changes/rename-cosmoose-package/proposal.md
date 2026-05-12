## Why

The core package is currently published as `@cosmoose/core`, but `cosmoose` (unscoped) is shorter, more memorable, and follows the convention of popular ODM/ORM libraries (e.g., `mongoose`, `drizzle-orm`). An unscoped name improves DX for the primary package.

Additionally, publishing `@cosmoose/cosmoose` as a scoped alias provides symmetry with `@cosmoose/nestjs` for users who prefer scoped installs across their project. Since `@cosmoose/core` is already published to npm, the old name must be deprecated gracefully with a migration wrapper.

## What Changes

- **BREAKING**: Rename the primary npm package from `@cosmoose/core` to `cosmoose`
- Add a new thin alias package `@cosmoose/cosmoose` that re-exports everything from `cosmoose`
- Publish a final version of `@cosmoose/core` that re-exports from `cosmoose` and marks itself deprecated
- Update all TypeScript path aliases from `@cosmoose/core` to `cosmoose`
- Update `cosmoose-nestjs` dependency from `@cosmoose/core` to `cosmoose`
- Update all documentation, READMEs, install commands, and import examples to use `cosmoose`
- Add `@cosmoose/cosmoose` and `@cosmoose/core` (deprecation wrapper) to the Nx release pipeline

## Capabilities

### New Capabilities

- `package-alias`: Thin wrapper package `@cosmoose/cosmoose` that re-exports from `cosmoose` for scoped-name symmetry with `@cosmoose/nestjs`
- `package-deprecation`: Final `@cosmoose/core` release that re-exports from `cosmoose` and includes npm deprecation notice

### Modified Capabilities

- `cosmoose-lib-scaffold`: Package name changes from `@cosmoose/core` to `cosmoose`
- `cosmoose-nestjs-lib-scaffold`: Core dependency changes from `@cosmoose/core` to `cosmoose`
- `nx-workspace-setup`: TypeScript path alias changes from `@cosmoose/core` to `cosmoose`
- `npm-publish`: Release pipeline must include `@cosmoose/cosmoose` alias package and handle `@cosmoose/core` deprecation publish

## Impact

- **npm registry**: Three package names involved — `cosmoose` (new primary), `@cosmoose/cosmoose` (alias), `@cosmoose/core` (deprecated)
- **Existing users**: Anyone on `@cosmoose/core` will get a deprecation notice pointing to `cosmoose`; their code continues to work via the re-export wrapper
- **Monorepo config**: `tsconfig.base.json`, `package.json` files, `nx.json` release config all change
- **Documentation**: All docs, READMEs, and install commands updated to `cosmoose`
- **CI/CD**: Publish pipeline updated to release three packages in order: `cosmoose` → `@cosmoose/cosmoose` → `@cosmoose/nestjs`
