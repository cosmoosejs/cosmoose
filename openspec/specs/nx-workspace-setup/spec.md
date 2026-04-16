## ADDED Requirements

### Requirement: Nx workspace initialization
The repository SHALL be initialized as an Nx integrated monorepo with `nx.json` at the root.

#### Scenario: Fresh workspace setup
- **WHEN** the init-nx-monorepo change is applied to the repository
- **THEN** an `nx.json` file SHALL exist at the repository root with valid Nx configuration

#### Scenario: pnpm workspace configuration
- **WHEN** the workspace is initialized
- **THEN** a `pnpm-workspace.yaml` file SHALL exist at the root with `packages/*` listed as a workspace glob

#### Scenario: Root package.json references Nx
- **WHEN** the workspace is initialized
- **THEN** the root `package.json` SHALL include Nx packages in `devDependencies` and the `packageManager` field SHALL remain `pnpm@10.33.0`

### Requirement: Shared TypeScript configuration
The workspace SHALL have a base `tsconfig.base.json` at the root that all projects extend.

#### Scenario: Base tsconfig exists
- **WHEN** the workspace is initialized
- **THEN** a `tsconfig.base.json` SHALL exist at the root with `compilerOptions` targeting ES2022 and enabling strict mode

#### Scenario: Path aliases for packages
- **WHEN** the base tsconfig is created
- **THEN** it SHALL define TypeScript path aliases mapping `@cosmoose/core` to the cosmoose library source and `@cosmoose/nestjs` to the cosmoose-nestjs library source

### Requirement: Shared ESLint configuration
The workspace SHALL have a root ESLint configuration that all projects inherit.

#### Scenario: Root ESLint config exists
- **WHEN** the workspace is initialized
- **THEN** an ESLint configuration file SHALL exist at the root with TypeScript support configured

### Requirement: Nx caching enabled
The workspace SHALL leverage Nx computation caching for build, test, and lint tasks.

#### Scenario: Cacheable targets defined
- **WHEN** `nx.json` is configured
- **THEN** the `build`, `test`, and `lint` targets SHALL be listed as cacheable in `nx.json`
