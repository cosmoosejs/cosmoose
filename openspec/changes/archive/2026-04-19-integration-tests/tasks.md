## 1. Dependencies & Nx Target

- [x] 1.1 Install `testcontainers` and `@testcontainers/azurecosmosdb` as root dev dependencies
- [x] 1.2 Add `test:integration` target to `packages/cosmoose/project.json` pointing to `integration/vitest.config.ts`

## 2. Integration Test Infrastructure

- [x] 2.1 Create `packages/cosmoose/integration/vitest.config.ts` with globalSetup/globalTeardown refs and `*.integration.spec.ts` include pattern
- [x] 2.2 Create `packages/cosmoose/integration/global-setup.ts` — start emulator container via `AzureCosmosDbEmulatorContainer`, export endpoint and key as env vars
- [x] 2.3 Create `packages/cosmoose/integration/global-teardown.ts` — stop the emulator container
- [x] 2.4 Create `packages/cosmoose/integration/helpers.ts` — shared utilities for creating a Cosmoose instance, unique database names, and test schemas

## 3. Spike: Emulator Capability Verification

- [x] 3.1 Create `packages/cosmoose/integration/spike.integration.spec.ts` — test custom indexing policies, container replace, unique keys, TTL, and basic CRUD against the emulator
- [x] 3.2 Run the spike, document findings, and adjust subsequent test scope based on results

## 4. Integration Test Suites

- [x] 4.1 Create `packages/cosmoose/integration/model.integration.spec.ts` — CRUD operations (create, findById, replaceById, patchById, deleteById)
- [x] 4.2 Create `packages/cosmoose/integration/query.integration.spec.ts` — query execution (equality filter, ordering, pagination)
- [x] 4.3 Create `packages/cosmoose/integration/sync-containers.integration.spec.ts` — container sync (partition key, unique keys, TTL)
- [x] 4.4 Create `packages/cosmoose/integration/bulk.integration.spec.ts` — bulk operations (bulk create, individual retrieval verification)
