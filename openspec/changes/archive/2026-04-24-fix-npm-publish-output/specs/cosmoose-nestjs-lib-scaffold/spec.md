## MODIFIED Requirements

### Requirement: Cosmoose NestJS npm package configuration
The NestJS library SHALL be configured as a publishable npm package named `@cosmoose/nestjs`.

#### Scenario: Package metadata
- **WHEN** `packages/cosmoose-nestjs/package.json` is inspected
- **THEN** the `name` field SHALL be `@cosmoose/nestjs` and the `version` field SHALL be `0.0.1`

#### Scenario: Dependency on core
- **WHEN** `packages/cosmoose-nestjs/package.json` is inspected
- **THEN** `@cosmoose/core` SHALL be listed as a `peerDependency`

#### Scenario: NestJS peer dependencies
- **WHEN** `packages/cosmoose-nestjs/package.json` is inspected
- **THEN** `@nestjs/common` and `@nestjs/core` SHALL be listed as `peerDependencies`

#### Scenario: Package main and types fields
- **WHEN** the package is built
- **THEN** `package.json` SHALL define `main` as `./index.js`, `module` as `./index.js`, and `types` as `./index.d.ts` pointing to the build output root (no `dist/` or `src/` prefix)

#### Scenario: Package exports field
- **WHEN** the package is built
- **THEN** `package.json` SHALL define `exports["."].import` as `./index.js` and `exports["."].types` as `./index.d.ts`

#### Scenario: Package files filter
- **WHEN** the package is packed for publishing
- **THEN** the `files` field SHALL include all compiled `.js`, `.d.ts`, and source map files so that `pnpm pack --dry-run` lists JavaScript and declaration files

### Requirement: Cosmoose NestJS build target
The NestJS library SHALL have an Nx `build` target using `@nx/js:tsc`.

#### Scenario: Build produces output
- **WHEN** `nx build cosmoose-nestjs` is executed
- **THEN** compiled JavaScript and declaration files SHALL be emitted to `dist/packages/cosmoose-nestjs`

#### Scenario: Build depends on core
- **WHEN** `nx build cosmoose-nestjs` is executed
- **THEN** Nx SHALL build `cosmoose` first if it is not already built (implicit dependency via `@cosmoose/core` import)

#### Scenario: Build output is flat
- **WHEN** `nx build cosmoose-nestjs` is executed
- **THEN** the compiled output SHALL NOT contain a `src/` subdirectory; `index.js` and `index.d.ts` SHALL exist directly in `dist/packages/cosmoose-nestjs/`

#### Scenario: TypeScript rootDir is set
- **WHEN** `packages/cosmoose-nestjs/tsconfig.lib.json` is inspected
- **THEN** `compilerOptions.rootDir` SHALL be set to `./src`
