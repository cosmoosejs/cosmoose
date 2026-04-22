## ADDED Requirements

### Requirement: Root README exists

A `README.md` SHALL exist at the repository root.

#### Scenario: README is present

- **WHEN** a user visits the GitHub repository
- **THEN** a `README.md` is displayed with project information

### Requirement: Root README contains quick-start

The root `README.md` SHALL contain a self-contained quick-start section that demonstrates the core usage flow without requiring the user to visit the docs site.

#### Scenario: Quick-start covers connect

- **WHEN** a user reads the quick-start section
- **THEN** it SHALL show how to create a `Cosmoose` instance and connect to a database

#### Scenario: Quick-start covers schema definition

- **WHEN** a user reads the quick-start section
- **THEN** it SHALL show how to define a `Schema` with typed fields

#### Scenario: Quick-start covers model creation

- **WHEN** a user reads the quick-start section
- **THEN** it SHALL show how to create a `Model` from a schema

#### Scenario: Quick-start covers CRUD and query

- **WHEN** a user reads the quick-start section
- **THEN** it SHALL show how to create a document, retrieve it by ID, and query with filters

#### Scenario: Quick-start covers migration sync

- **WHEN** a user reads the quick-start section
- **THEN** it SHALL show how to use `syncContainers()` to create or update database containers

### Requirement: Root README links to docs site

The root `README.md` SHALL contain a prominent link to the full documentation at `cosmoose.vercel.app`.

#### Scenario: Docs link is visible

- **WHEN** a user reads the README
- **THEN** a link to `https://cosmoose.vercel.app` SHALL be present with clear labeling (e.g., "Full Documentation")

### Requirement: Root README contains feature list

The root `README.md` SHALL list the key features of the library.

#### Scenario: Features are listed

- **WHEN** a user reads the README
- **THEN** a features section SHALL list capabilities such as type-safe schemas, CRUD operations, query builder, migrations, and ID generation

### Requirement: Root README contains install instructions

The root `README.md` SHALL contain installation instructions using pnpm.

#### Scenario: Install command is shown

- **WHEN** a user reads the README
- **THEN** an install command (`pnpm add cosmoose`) SHALL be displayed

### Requirement: Package-level README for cosmoose

A `README.md` SHALL exist at `packages/cosmoose/README.md`. Its content SHALL match the root `README.md` (or be a trimmed version suitable for npm).

#### Scenario: Package README is published to npm

- **WHEN** the `cosmoose` package is published to npm
- **THEN** the `README.md` from `packages/cosmoose/` is displayed on the npm package page

### Requirement: Package-level README for cosmoose-nestjs

A `README.md` SHALL exist at `packages/cosmoose-nestjs/README.md` with a placeholder indicating the package is under development and linking to the main docs site.

#### Scenario: NestJS package README exists

- **WHEN** the `cosmoose-nestjs` package is published to npm
- **THEN** a `README.md` is displayed indicating the package is under development with a link to `https://cosmoose.vercel.app`
