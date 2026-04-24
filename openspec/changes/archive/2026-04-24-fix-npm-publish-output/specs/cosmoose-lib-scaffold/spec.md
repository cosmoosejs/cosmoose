## MODIFIED Requirements

### Requirement: Cosmoose core npm package configuration
The core library SHALL be configured as a publishable npm package named `@cosmoose/core`.

#### Scenario: Package metadata
- **WHEN** `packages/cosmoose/package.json` is inspected
- **THEN** the `name` field SHALL be `@cosmoose/core` and the `version` field SHALL be `0.0.1`

#### Scenario: Package main and types fields
- **WHEN** the package is built
- **THEN** `package.json` SHALL define `main` as `./index.js`, `module` as `./index.js`, and `types` as `./index.d.ts` pointing to the build output root (no `dist/` or `src/` prefix)

#### Scenario: Package exports field
- **WHEN** the package is built
- **THEN** `package.json` SHALL define `exports["."].import` as `./index.js` and `exports["."].types` as `./index.d.ts`

#### Scenario: Package files filter
- **WHEN** the package is packed for publishing
- **THEN** the `files` field SHALL include all compiled `.js`, `.d.ts`, and source map files so that `pnpm pack --dry-run` lists JavaScript and declaration files

### Requirement: Cosmoose core build target
The core library SHALL have an Nx `build` target using `@nx/js:tsc`.

#### Scenario: Build produces output
- **WHEN** `nx build cosmoose` is executed
- **THEN** compiled JavaScript and declaration files SHALL be emitted to `dist/packages/cosmoose`

#### Scenario: Build output is flat
- **WHEN** `nx build cosmoose` is executed
- **THEN** the compiled output SHALL NOT contain a `src/` subdirectory; `index.js` and `index.d.ts` SHALL exist directly in `dist/packages/cosmoose/`

#### Scenario: TypeScript rootDir is set
- **WHEN** `packages/cosmoose/tsconfig.lib.json` is inspected
- **THEN** `compilerOptions.rootDir` SHALL be set to `./src`
