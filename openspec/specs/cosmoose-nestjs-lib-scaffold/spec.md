## ADDED Requirements

### Requirement: Cosmoose NestJS library project exists
A publishable Nx library project SHALL exist at `packages/cosmoose-nestjs` for the NestJS integration module.

#### Scenario: Project directory structure
- **WHEN** the project is scaffolded
- **THEN** `packages/cosmoose-nestjs` SHALL contain a `project.json`, `package.json`, `tsconfig.json`, `tsconfig.lib.json`, and `tsconfig.spec.json`

#### Scenario: Source entry point
- **WHEN** the project is scaffolded
- **THEN** `packages/cosmoose-nestjs/src/index.ts` SHALL exist as the library entry point

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

### Requirement: Cosmoose NestJS build target
The NestJS library SHALL have an Nx `build` target using `@nx/js:tsc`.

#### Scenario: Build produces output
- **WHEN** `nx build cosmoose-nestjs` is executed
- **THEN** compiled JavaScript and declaration files SHALL be emitted to `dist/packages/cosmoose-nestjs`

#### Scenario: Build depends on core
- **WHEN** `nx build cosmoose-nestjs` is executed
- **THEN** Nx SHALL build `cosmoose` first if it is not already built (implicit dependency via `@cosmoose/core` import)

### Requirement: Cosmoose NestJS test target
The NestJS library SHALL have an Nx `test` target using Vitest.

#### Scenario: Test target is runnable
- **WHEN** `nx test cosmoose-nestjs` is executed
- **THEN** Vitest SHALL run any test files matching `**/*.spec.ts` in the project

### Requirement: Cosmoose NestJS lint target
The NestJS library SHALL have an Nx `lint` target using ESLint.

#### Scenario: Lint target is runnable
- **WHEN** `nx lint cosmoose-nestjs` is executed
- **THEN** ESLint SHALL analyze the project source files
