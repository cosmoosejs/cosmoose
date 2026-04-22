## Why

All tests currently mock `@azure/cosmos` entirely. This means bugs in SQL query syntax, partition key behavior, indexing policy effects, unique key constraints, and container sync logic are invisible until deployed against a real Cosmos DB instance. Integration tests against the Azure Cosmos DB Linux emulator (via Testcontainers) would catch these issues locally and in CI.

## What Changes

- Add `@testcontainers/azurecosmosdb` and `testcontainers` as dev dependencies
- Create an `integration/` directory under `packages/cosmoose/` with a separate Vitest config
- Implement a `globalSetup` that starts the Cosmos DB emulator container and exports connection details
- Add a `test:integration` Nx target for the `cosmoose` package
- Write integration test suites (`*.integration.spec.ts`) covering CRUD, queries, sync containers, and bulk operations against the real emulator
- Spike first to verify emulator capabilities (custom indexing policies, `container.replace()`) before writing full test suites

## Capabilities

### New Capabilities
- `integration-testing`: Infrastructure and test suites for running integration tests against the Azure Cosmos DB Linux emulator via Testcontainers

### Modified Capabilities

_None — this adds test infrastructure only; no changes to existing library behavior or specs._

## Impact

- **Dependencies**: `testcontainers` and `@testcontainers/azurecosmosdb` added as dev dependencies at the root
- **Nx config**: New `test:integration` target in `packages/cosmoose/project.json`
- **Docker requirement**: Docker must be running to execute integration tests
- **CI**: Not wired up initially — local-only for now, CI integration deferred
