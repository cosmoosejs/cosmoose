## ADDED Requirements

### Requirement: Emulator container lifecycle management
The system SHALL provide a Vitest `globalSetup` that starts an Azure Cosmos DB Linux emulator container via Testcontainers and a `globalTeardown` that stops it. The emulator endpoint and key SHALL be made available to all test files via environment variables.

#### Scenario: Emulator starts before integration tests
- **WHEN** the `test:integration` target is executed
- **THEN** the globalSetup starts a Cosmos DB emulator container using `@testcontainers/azurecosmosdb` with HTTP protocol
- **AND** sets `COSMOS_ENDPOINT` and `COSMOS_KEY` environment variables for test processes

#### Scenario: Emulator stops after integration tests
- **WHEN** all integration test suites have completed
- **THEN** the globalTeardown stops and removes the emulator container

### Requirement: Separate Vitest configuration for integration tests
The integration tests SHALL use a dedicated Vitest configuration at `packages/cosmoose/integration/vitest.config.ts` that includes only `*.integration.spec.ts` files and references the global setup/teardown modules.

#### Scenario: Integration config includes only integration tests
- **WHEN** the integration Vitest config is loaded
- **THEN** it SHALL include files matching `**/*.integration.spec.ts` within the `integration/` directory
- **AND** it SHALL NOT include unit test files from `src/`

### Requirement: Nx target for integration tests
The `cosmoose` package SHALL have a `test:integration` target in `project.json` that runs integration tests using the dedicated Vitest configuration.

#### Scenario: Running integration tests via Nx
- **WHEN** a developer runs `nx run cosmoose:test:integration`
- **THEN** Vitest executes with the integration config
- **AND** the emulator container is started, tests run, and the container is stopped

#### Scenario: Default test target is unaffected
- **WHEN** a developer runs `nx test cosmoose`
- **THEN** only unit tests in `src/**/*.spec.ts` are executed
- **AND** no Docker container is started

### Requirement: Database-per-suite isolation
Each integration test file SHALL create a uniquely-named database in `beforeAll` and delete it in `afterAll` to ensure test isolation without restarting the emulator.

#### Scenario: Tests are isolated between suites
- **WHEN** two integration test files run sequentially
- **THEN** each operates on its own database instance
- **AND** data from one suite is not visible to the other

### Requirement: Integration test for CRUD operations
Integration tests SHALL verify that `Model.create()`, `Model.findById()`, `Model.replaceById()`, `Model.patchById()`, and `Model.deleteById()` work correctly against the real emulator.

#### Scenario: Create and read a document
- **WHEN** a document is created via `Model.create()`
- **THEN** `Model.findById()` SHALL return the same document with matching fields

#### Scenario: Replace a document
- **WHEN** a document is replaced via `Model.replaceById()` with updated fields
- **THEN** `Model.findById()` SHALL return the document with the updated fields

#### Scenario: Patch a document
- **WHEN** a document is patched via `Model.patchById()` with patch operations
- **THEN** `Model.findById()` SHALL return the document with the patched fields applied

#### Scenario: Delete a document
- **WHEN** a document is deleted via `Model.deleteById()`
- **THEN** `Model.findById()` SHALL return no resource

### Requirement: Integration test for query execution
Integration tests SHALL verify that `QueryBuilder` produces SQL that executes correctly against the real emulator, including filtering, ordering, and pagination.

#### Scenario: Query with equality filter
- **WHEN** documents are created and a query filters by an exact field value
- **THEN** only matching documents SHALL be returned

#### Scenario: Query with ordering
- **WHEN** documents are created and a query specifies order by a field
- **THEN** results SHALL be returned in the specified order

### Requirement: Integration test for container sync
Integration tests SHALL verify that `syncContainers()` creates containers with the correct partition key, unique keys, and TTL settings.

#### Scenario: Container created with partition key
- **WHEN** `syncContainers()` is called with a schema defining a partition key
- **THEN** the created container SHALL have the specified partition key path

#### Scenario: Container created with TTL
- **WHEN** `syncContainers()` is called with a schema defining a default TTL
- **THEN** the created container SHALL have TTL enabled with the specified default

### Requirement: Integration test for bulk operations
Integration tests SHALL verify that `Model.bulkCreate()` and other bulk operations execute correctly against the emulator.

#### Scenario: Bulk create documents
- **WHEN** multiple documents are created via bulk operation
- **THEN** all documents SHALL be retrievable individually via `Model.findById()`
