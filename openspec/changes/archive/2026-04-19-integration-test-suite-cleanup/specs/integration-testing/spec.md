## REMOVED Requirements

### Requirement: Spike verification of emulator limitations
**Reason**: The spike was a temporal precondition — "before writing full test suites" — that has been fulfilled. All emulator behaviors the spike explored (composite indexes, container replace) are now properly asserted in `sync-containers.integration.spec.ts`. The spike file (`spike.integration.spec.ts`) uses non-asserting `expect(true).toBe(true)` patterns and duplicates coverage from the four dedicated test suites.
**Migration**: No migration needed. All spike scenarios are covered by existing integration test files:
- Composite index behavior → `sync-containers.integration.spec.ts`
- Container replace behavior → `sync-containers.integration.spec.ts`
- Basic CRUD → `model.integration.spec.ts`
- Query execution → `query.integration.spec.ts`
- Bulk operations → `bulk.integration.spec.ts`
- Partition key / unique keys / TTL → `sync-containers.integration.spec.ts`
