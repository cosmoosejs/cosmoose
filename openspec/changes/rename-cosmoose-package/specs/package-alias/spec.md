## ADDED Requirements

### Requirement: Alias package exists
A thin wrapper package SHALL exist at `packages/cosmoose-alias/` that re-exports the `cosmoose` package under the scoped name `@cosmoose/cosmoose`.

#### Scenario: Package metadata
- **WHEN** `packages/cosmoose-alias/package.json` is inspected
- **THEN** the `name` field SHALL be `@cosmoose/cosmoose`

#### Scenario: Re-export of cosmoose
- **WHEN** the package is built
- **THEN** `packages/cosmoose-alias/src/index.ts` SHALL contain `export * from 'cosmoose'`

#### Scenario: Dependency on cosmoose
- **WHEN** `packages/cosmoose-alias/package.json` is inspected
- **THEN** `cosmoose` SHALL be listed as a runtime dependency

#### Scenario: Public publish access
- **WHEN** `packages/cosmoose-alias/package.json` is inspected
- **THEN** `publishConfig.access` SHALL be `"public"`

### Requirement: Alias package Nx project
The alias package SHALL be recognized as an Nx library project with build and publish capabilities.

#### Scenario: Project is recognized by Nx
- **WHEN** `pnpm exec nx show project cosmoose-alias` is run
- **THEN** the project is found and its configuration is displayed

#### Scenario: Build produces output
- **WHEN** `pnpm exec nx build cosmoose-alias` is run
- **THEN** compiled JavaScript and declaration files SHALL be emitted
