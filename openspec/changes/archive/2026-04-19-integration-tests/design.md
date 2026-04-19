## Context

Cosmoose is a TypeScript ODM for Azure Cosmos DB. All existing tests mock the `@azure/cosmos` SDK, covering internal logic but not real database interactions. The Cosmos DB Linux emulator (vnext-preview) provides a local, lightweight NoSQL API endpoint suitable for integration testing. Testcontainers for Node.js has an official `@testcontainers/azurecosmosdb` module that manages the emulator container lifecycle programmatically.

Current test setup: Vitest with `*.spec.ts` files colocated with source in `packages/cosmoose/src/`. Unit tests run via `nx test cosmoose`.

## Goals / Non-Goals

**Goals:**
- Verify Cosmoose operations (CRUD, queries, sync, bulk) work correctly against a real Cosmos DB engine
- Automate emulator lifecycle — no manual Docker commands needed
- Keep integration tests separate from unit tests (different speed, different dependencies)
- Spike emulator capabilities first before committing to full test suites

**Non-Goals:**
- CI pipeline integration (deferred — local-only for now)
- Performance/load testing
- Testing the NestJS integration package against the emulator
- Testing against a real Azure Cosmos DB instance

## Decisions

### 1. Testcontainers over docker-compose

**Choice**: Use `@testcontainers/azurecosmosdb` to manage the emulator container.

**Alternatives considered**:
- *docker-compose + scripts*: Requires manual setup, separate lifecycle management, easy to forget to start/stop. Works but adds friction.
- *Pre-running emulator*: Developer must remember to start it. Breaks CI portability later.

**Rationale**: Testcontainers is purpose-built for this. Zero manual setup, deterministic, and the official Cosmos DB module handles readiness detection. CI-portable when we get there.

### 2. HTTP protocol (no TLS)

**Choice**: Run the emulator with `--protocol http`.

**Rationale**: The vnext emulator defaults to HTTP. The Node.js `@azure/cosmos` SDK supports HTTP. No self-signed certs, no `NODE_TLS_REJECT_UNAUTHORIZED=0`, no cert importing. Simplest path.

### 3. Separate integration directory and Vitest config

**Choice**: `packages/cosmoose/integration/` with its own `vitest.config.ts`.

**Alternatives considered**:
- *Same directory, tag-based filtering*: Mixes fast and slow tests, harder to run separately.
- *Top-level `integration/` at monorepo root*: Separates tests from the package they test.

**Rationale**: Colocated with the package, but clearly separated from unit tests. Own Vitest config allows different `globalSetup`, timeouts, and include patterns. The `test:integration` Nx target keeps it distinct from `test`.

### 4. One emulator instance, database-per-suite isolation

**Choice**: Start the emulator once in `globalSetup`, give each test file its own uniquely-named database.

**Alternatives considered**:
- *Container per test file*: Very slow (emulator startup per file).
- *Shared database, cleanup between tests*: Risk of test pollution.

**Rationale**: Emulator startup is the bottleneck (~10-30s). Starting once and isolating via databases gives both speed and isolation. Each test file creates its database in `beforeAll` and deletes it in `afterAll`.

### 5. Spike-first approach

**Choice**: Write a minimal spike test to verify emulator capabilities before building the full suite.

**Rationale**: The vnext emulator has known gaps — custom indexing policies and `container.replace()` (collection update) are marked "not yet implemented." The spike will reveal how these behave (silent ignore? error?) so the real test suites can be scoped accurately.

## Risks / Trade-offs

- **Emulator feature gaps** → Custom indexing policies and container updates may not work. Spike will determine impact. Mitigation: scope integration tests to supported features; keep unit tests for unsupported paths.
- **Docker dependency** → Integration tests require Docker running locally. Mitigation: `test:integration` is a separate target — `nx test cosmoose` still runs fast unit tests without Docker.
- **Emulator startup time** → Adds 10-30s to test runs. Mitigation: single container for all suites via `globalSetup`; never runs as part of default `test` target.
- **vnext-preview stability** → The emulator is in preview. Mitigation: pin the Docker image tag; monitor for updates.
