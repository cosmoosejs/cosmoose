## Why

The Cosmoose project consists of two packages — the core ODM library for Azure CosmosDB and a NestJS integration module. To manage these as independently publishable npm packages with shared tooling, a monorepo structure is needed. Nx provides the build system, dependency graph, and caching infrastructure to support this efficiently.

## What Changes

- Initialize Nx workspace in the existing repository
- Configure the repo as an Nx-managed monorepo with pnpm workspaces
- Create the `cosmoose` library project (core ODM for Azure CosmosDB, mongoose-style API)
- Create the `cosmoose-nestjs` library project (NestJS module wrapping Cosmoose)
- Set up shared TypeScript configuration
- Configure build, test, and lint targets for both libraries
- Set up publishable npm package configuration for both libraries
- Set up Husky with a pre-push git hook that runs test and lint before pushing to remote
- Set up Commitizen with `cz-conventional-changelog` adapter for standardized commit messages

## Capabilities

### New Capabilities
- `nx-workspace-setup`: Nx workspace initialization, workspace-level configuration (nx.json, workspace tsconfig, pnpm workspaces)
- `cosmoose-lib-scaffold`: Scaffold the core `cosmoose` library project with build/test/lint targets and publishable npm package config
- `cosmoose-nestjs-lib-scaffold`: Scaffold the `cosmoose-nestjs` library project with build/test/lint targets, dependency on `cosmoose`, and publishable npm package config
- `git-hooks-commitizen`: Husky pre-push hook running test and lint, Commitizen with `cz-conventional-changelog` for conventional commits

### Modified Capabilities

_None — this is a greenfield monorepo setup._

## Impact

- **Root config**: `package.json` will be updated; `nx.json`, `tsconfig.base.json`, and `pnpm-workspace.yaml` will be added
- **Project structure**: Two new library directories under `packages/` (or Nx-conventional path)
- **Dependencies**: Nx packages, TypeScript, build tooling, Husky, and Commitizen added as devDependencies
- **CI/Build**: All builds will go through Nx; existing scripts will be replaced or wrapped
- **Git workflow**: Pre-push hook enforces passing tests and lint; `cz` command available for guided commit creation
