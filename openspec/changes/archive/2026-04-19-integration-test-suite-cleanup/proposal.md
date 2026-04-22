## Why

The spike integration test (`spike.integration.spec.ts`) was written as an exploratory precursor to validate emulator capabilities before building proper test suites. All four dedicated integration test files now exist (`model`, `query`, `bulk`, `sync-containers`) and comprehensively cover every scenario the spike explored — including the two spike-unique areas (composite indexes and container replace) which are now properly asserted in `sync-containers.integration.spec.ts`. The spike file adds test runtime overhead, duplicates coverage, and contains non-asserting `expect(true).toBe(true)` patterns that provide no regression value.

## What Changes

- Remove `spike.integration.spec.ts` — all scenarios are covered by dedicated test files with proper assertions
- Update the integration-testing spec to mark the spike requirement as fulfilled and clarify that it was a one-time verification step, not a persistent test

## Capabilities

### New Capabilities

_None — this change removes dead test code, it does not introduce new capabilities._

### Modified Capabilities

- `integration-testing`: Update the spike verification requirement to clarify its temporal nature — it was a pre-condition step that has been fulfilled, not a persistent test suite requirement

## Impact

- **Code**: Removes `packages/cosmoose/integration/spike.integration.spec.ts` (~220 lines)
- **Test runtime**: Reduces integration test execution time by removing redundant emulator operations (container creation, CRUD, bulk, query)
- **Specs**: Minor wording update to `openspec/specs/integration-testing/spec.md`
- **No breaking changes**: No public API or behavior changes
