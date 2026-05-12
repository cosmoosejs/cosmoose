## MODIFIED Requirements

### Requirement: Cosmoose NestJS npm package configuration
The NestJS library SHALL be configured as a publishable npm package named `@cosmoose/nestjs`.

#### Scenario: Package metadata
- **WHEN** `packages/cosmoose-nestjs/package.json` is inspected
- **THEN** the `name` field SHALL be `@cosmoose/nestjs` and the `version` field SHALL be `0.0.1`

#### Scenario: Dependency on core
- **WHEN** `packages/cosmoose-nestjs/package.json` is inspected
- **THEN** `cosmoose` SHALL be listed as a `peerDependency`

#### Scenario: NestJS peer dependencies
- **WHEN** `packages/cosmoose-nestjs/package.json` is inspected
- **THEN** `@nestjs/common` and `@nestjs/core` SHALL be listed as `peerDependencies`

#### Scenario: Build depends on core
- **WHEN** `nx build cosmoose-nestjs` is executed
- **THEN** Nx SHALL build `cosmoose` first if it is not already built (implicit dependency via `cosmoose` import)
