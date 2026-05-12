## MODIFIED Requirements

### Requirement: Shared TypeScript configuration
The workspace SHALL have a base `tsconfig.base.json` at the root that all projects extend.

#### Scenario: Base tsconfig exists
- **WHEN** the workspace is initialized
- **THEN** a `tsconfig.base.json` SHALL exist at the root with `compilerOptions` targeting ES2022 and enabling strict mode

#### Scenario: Path aliases for packages
- **WHEN** the base tsconfig is created
- **THEN** it SHALL define TypeScript path aliases mapping `cosmoose` to the cosmoose library source and `@cosmoose/nestjs` to the cosmoose-nestjs library source
