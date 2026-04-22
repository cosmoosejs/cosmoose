## Context

The integration test suite currently contains five test files. Four are production-quality, domain-specific suites (`model`, `query`, `bulk`, `sync-containers`) with proper assertions and full scenario coverage. The fifth, `spike.integration.spec.ts`, was a temporary exploratory test written before the full suites existed to verify Azure Cosmos DB emulator behavior for composite indexes and container replace operations.

The spike has fulfilled its purpose: its findings informed the design of `sync-containers.integration.spec.ts`, which now properly asserts both composite index creation and container replace/update behavior. The spike remains as dead code with `expect(true).toBe(true)` patterns and duplicated coverage.

## Goals / Non-Goals

**Goals:**
- Remove the spike integration test file to eliminate redundant test coverage and reduce CI runtime
- Update the integration-testing spec to reflect that the spike requirement was a one-time precondition, now fulfilled

**Non-Goals:**
- Adding new integration test scenarios (covered by separate future changes)
- Refactoring existing integration test helpers or infrastructure
- Changing the integration test execution pipeline or emulator setup

## Decisions

### Decision 1: Delete spike file entirely rather than refactoring

**Choice**: Delete `spike.integration.spec.ts` entirely.

**Rationale**: Every scenario in the spike is already covered with proper assertions in dedicated test files. The two "spike-unique" scenarios (composite indexes, container replace) are now fully covered in `sync-containers.integration.spec.ts`. There is no value in keeping an exploratory test that uses `expect(true).toBe(true)`.

**Alternative considered**: Extract spike-unique tests into the relevant test files. Rejected because those scenarios are already covered with proper assertions.

### Decision 2: Modify existing spec rather than deprecate

**Choice**: Update the spike verification requirement wording in the integration-testing spec to clarify its temporal, fulfilled nature.

**Rationale**: The requirement was valid at the time it was written — it served as a gate before building full suites. Marking it as REMOVED with a migration note accurately captures that the knowledge has been absorbed into the production test suites.

## Risks / Trade-offs

- **[Low] Loss of exploratory test patterns**: The spike contains try/catch patterns for documenting emulator quirks. → Mitigated: these behaviors are now properly tested and asserted in `sync-containers.integration.spec.ts`.
- **[Low] Spec divergence**: Removing a requirement from the spec could cause confusion if someone reads the archived change. → Mitigated: the REMOVED section will include clear rationale and point to the covering tests.
