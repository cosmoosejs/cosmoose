## ADDED Requirements

### Requirement: Cosmoose core library project exists
A publishable Nx library project SHALL exist at `packages/cosmoose` for the core CosmosDB ODM.

#### Scenario: Project directory structure
- **WHEN** the project is scaffolded
- **THEN** `packages/cosmoose` SHALL contain a `project.json`, `package.json`, `tsconfig.json`, `tsconfig.lib.json`, and `tsconfig.spec.json`

#### Scenario: Source entry point
- **WHEN** the project is scaffolded
- **THEN** `packages/cosmoose/src/index.ts` SHALL exist as the library entry point

### Requirement: Cosmoose core npm package configuration
The core library SHALL be configured as a publishable npm package named `@cosmoose/core`.

#### Scenario: Package metadata
- **WHEN** `packages/cosmoose/package.json` is inspected
- **THEN** the `name` field SHALL be `@cosmoose/core` and the `version` field SHALL be `0.0.1`

#### Scenario: Package main and types fields
- **WHEN** the package is built
- **THEN** `package.json` SHALL define `main`, `module`, and `types` fields pointing to the build output

#### Scenario: Explicit ./index.js entry point
- **WHEN** `packages/cosmoose/package.json` is inspected
- **THEN** `main` SHALL be `./index.js`, `module` SHALL be `./index.js`, and `types` SHALL be `./index.d.ts`

#### Scenario: Exports field
- **WHEN** `packages/cosmoose/package.json` is inspected
- **THEN** the `exports` field SHALL map `.` to `./index.js` with a `types` condition pointing to `./index.d.ts`

#### Scenario: Files filter
- **WHEN** `packages/cosmoose/package.json` is inspected
- **THEN** the `files` field SHALL include `**/*.js`, `**/*.d.ts`, `**/*.js.map`, and `**/*.d.ts.map` patterns

### Requirement: Cosmoose core build target
The core library SHALL have an Nx `build` target using `@nx/js:tsc`.

#### Scenario: Build produces output
- **WHEN** `nx build cosmoose` is executed
- **THEN** compiled JavaScript and declaration files SHALL be emitted to `dist/packages/cosmoose`

#### Scenario: Build output is flat
- **WHEN** `nx build cosmoose` is executed
- **THEN** compiled files SHALL be emitted directly under `dist/packages/cosmoose/` without a nested `src/` directory

#### Scenario: TypeScript rootDir is set
- **WHEN** `packages/cosmoose/tsconfig.lib.json` is inspected
- **THEN** `compilerOptions.rootDir` SHALL be `./src`

### Requirement: Cosmoose core test target
The core library SHALL have an Nx `test` target using Vitest.

#### Scenario: Test target is runnable
- **WHEN** `nx test cosmoose` is executed
- **THEN** Vitest SHALL run any test files matching `**/*.spec.ts` in the project

### Requirement: Cosmoose core lint target
The core library SHALL have an Nx `lint` target using ESLint.

#### Scenario: Lint target is runnable
- **WHEN** `nx lint cosmoose` is executed
- **THEN** ESLint SHALL analyze the project source files
