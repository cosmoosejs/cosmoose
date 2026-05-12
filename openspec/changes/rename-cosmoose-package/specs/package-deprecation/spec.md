## ADDED Requirements

### Requirement: Deprecation wrapper package exists
A thin wrapper package SHALL exist at `packages/cosmoose-deprecated/` that re-exports the `cosmoose` package under the legacy name `@cosmoose/core`.

#### Scenario: Package metadata
- **WHEN** `packages/cosmoose-deprecated/package.json` is inspected
- **THEN** the `name` field SHALL be `@cosmoose/core`

#### Scenario: Deprecated field
- **WHEN** `packages/cosmoose-deprecated/package.json` is inspected
- **THEN** the `deprecated` field SHALL contain a message directing users to install `cosmoose` or `@cosmoose/cosmoose` instead

#### Scenario: Re-export of cosmoose
- **WHEN** the package is built
- **THEN** `packages/cosmoose-deprecated/src/index.ts` SHALL contain `export * from 'cosmoose'`

#### Scenario: Dependency on cosmoose
- **WHEN** `packages/cosmoose-deprecated/package.json` is inspected
- **THEN** `cosmoose` SHALL be listed as a runtime dependency

### Requirement: Deprecation wrapper Nx project
The deprecation wrapper SHALL be recognized as an Nx library project with build and publish capabilities.

#### Scenario: Project is recognized by Nx
- **WHEN** `pnpm exec nx show project cosmoose-deprecated` is run
- **THEN** the project is found and its configuration is displayed

### Requirement: npm deprecation of all @cosmoose/core versions
After publishing the final wrapper version, all existing versions of `@cosmoose/core` on npm SHALL be marked as deprecated.

#### Scenario: Deprecation message on npm
- **WHEN** a user runs `npm view @cosmoose/core`
- **THEN** all versions SHALL show a deprecation message directing users to `cosmoose`
